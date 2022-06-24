package export

import (
	"context"
	"fmt"
	"path"
	"sync"
	"time"

	"github.com/go-git/go-git/v5"

	"github.com/grafana/grafana/pkg/infra/log"
	"github.com/grafana/grafana/pkg/models"
	"github.com/grafana/grafana/pkg/services/sqlstore"
)

var _ Job = new(gitExportJob)

type gitExportJob struct {
	logger  log.Logger
	sql     *sqlstore.SQLStore
	orgID   int64
	rootDir string

	statusMu    sync.Mutex
	status      ExportStatus
	cfg         ExportConfig
	broadcaster statusBroadcaster
}

func startGitExportJob(cfg ExportConfig, sql *sqlstore.SQLStore, rootDir string, orgID int64, broadcaster statusBroadcaster) (Job, error) {
	job := &gitExportJob{
		logger:      log.New("git_export_job"),
		cfg:         cfg,
		sql:         sql,
		orgID:       orgID,
		rootDir:     rootDir,
		broadcaster: broadcaster,
		status: ExportStatus{
			Running: true,
			Target:  "git export",
			Started: time.Now().UnixMilli(),
			Current: 0,
		},
	}

	broadcaster(job.status)
	go job.start()
	return job, nil
}

func (e *gitExportJob) getStatus() ExportStatus {
	e.statusMu.Lock()
	defer e.statusMu.Unlock()

	return e.status
}

func (e *gitExportJob) getConfig() ExportConfig {
	e.statusMu.Lock()
	defer e.statusMu.Unlock()

	return e.cfg
}

// Utility function to export dashboards
func (e *gitExportJob) start() {
	defer func() {
		e.logger.Info("Finished git export job")

		e.statusMu.Lock()
		defer e.statusMu.Unlock()
		s := e.status
		if err := recover(); err != nil {
			e.logger.Error("export panic", "error", err)
			s.Status = fmt.Sprintf("ERROR: %v", err)
		}
		// Make sure it finishes OK
		if s.Finished < 10 {
			s.Finished = time.Now().UnixMilli()
		}
		s.Running = false
		if s.Status == "" {
			s.Status = "done"
		}
		s.Target = e.rootDir
		e.status = s
		e.broadcaster(s)
	}()

	if true {
		err := e.doExportWithHistory()
		if err != nil {
			e.logger.Error("ERROR", "e", err)
			e.status.Status = "ERROR"
			e.status.Last = err.Error()
			e.broadcaster(e.status)
		}
	}
}

func (e *gitExportJob) doExportWithHistory() error {
	r, err := git.PlainInit(e.rootDir, false)
	if err != nil {
		return err
	}
	w, err := r.Worktree()
	if err != nil {
		return err
	}
	helper := &commitHelper{
		repo:    r,
		work:    w,
		ctx:     context.Background(),
		workDir: e.rootDir,
		orgDir:  e.rootDir,
	}

	cmd := &models.SearchOrgsQuery{}
	err = e.sql.SearchOrgs(helper.ctx, cmd)
	if err != nil {
		return err
	}

	// Export each org
	for _, org := range cmd.Result {
		if len(cmd.Result) > 1 {
			helper.orgDir = path.Join(e.rootDir, fmt.Sprintf("org_%d", org.Id))
		}
		err = helper.initOrg(e.sql, org.Id)
		if err != nil {
			return err
		}

		err = e.doOrgExportWithHistory(helper)
		if err != nil {
			return err
		}
	}

	// cleanup the folder
	e.status.Target = "pruning..."
	e.broadcaster(e.status)
	r.Prune(git.PruneOptions{})

	// TODO
	// git gc --prune=now --aggressive

	return nil
}

func (e *gitExportJob) doOrgExportWithHistory(helper *commitHelper) error {
	err := exportAuth(helper, e)
	if err != nil {
		return err
	}

	if true {
		err = exportDashboards(helper, e)
		if err != nil {
			return err
		}
	}

	return err
}

/**

// TODO -- initalize on main!! (currently master)
git branch -m master main

git remote add origin git@github.com:ryantxu/test-dash-repo.git
git branch -M main
git push -u origin main

**/
