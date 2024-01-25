package folderimpl

import (
	"context"
	"fmt"
	"runtime"
	"strings"
	"time"

	"github.com/grafana/dskit/concurrency"

	"github.com/grafana/grafana/pkg/infra/db"
	"github.com/grafana/grafana/pkg/infra/log"
	"github.com/grafana/grafana/pkg/infra/metrics"
	"github.com/grafana/grafana/pkg/services/dashboards"
	"github.com/grafana/grafana/pkg/services/folder"
	"github.com/grafana/grafana/pkg/services/sqlstore/migrator"
	"github.com/grafana/grafana/pkg/setting"
	"github.com/grafana/grafana/pkg/util"
)

const DEFAULT_BATCH_SIZE = 999

type sqlStore struct {
	db  db.DB
	log log.Logger
	cfg *setting.Cfg
}

// sqlStore implements the store interface.
var _ store = (*sqlStore)(nil)

func ProvideStore(db db.DB, cfg *setting.Cfg) *sqlStore {
	return &sqlStore{db: db, log: log.New("folder-store"), cfg: cfg}
}

func (ss *sqlStore) Create(ctx context.Context, cmd folder.CreateFolderCommand) (*folder.Folder, error) {
	if cmd.UID == "" {
		return nil, folder.ErrBadRequest.Errorf("missing UID")
	}

	var foldr *folder.Folder
	/*
		version := 1
		updatedBy := cmd.SignedInUser.UserID
		createdBy := cmd.SignedInUser.UserID
	*/
	var lastInsertedID int64
	err := ss.db.WithDbSession(ctx, func(sess *db.Session) error {
		var sql string
		var args []any
		if cmd.ParentUID == "" {
			sql = "INSERT INTO folder(org_id, uid, title, description, created, updated) VALUES(?, ?, ?, ?, ?, ?)"
			args = []any{cmd.OrgID, cmd.UID, cmd.Title, cmd.Description, time.Now(), time.Now()}
		} else {
			if cmd.ParentUID != folder.GeneralFolderUID {
				if _, err := ss.Get(ctx, folder.GetFolderQuery{
					UID:   &cmd.ParentUID,
					OrgID: cmd.OrgID,
				}); err != nil {
					return folder.ErrFolderNotFound.Errorf("parent folder does not exist")
				}
			}
			sql = "INSERT INTO folder(org_id, uid, parent_uid, title, description, created, updated) VALUES(?, ?, ?, ?, ?, ?, ?)"
			args = []any{cmd.OrgID, cmd.UID, cmd.ParentUID, cmd.Title, cmd.Description, time.Now(), time.Now()}
		}

		var err error
		lastInsertedID, err = sess.WithReturningID(ss.db.GetDialect().DriverName(), sql, args)
		if err != nil {
			return err
		}

		metrics.MFolderIDsServiceCount.WithLabelValues(metrics.Folder).Inc()
		foldr, err = ss.Get(ctx, folder.GetFolderQuery{
			ID: &lastInsertedID, // nolint:staticcheck
		})
		if err != nil {
			return err
		}
		return nil
	})
	return foldr.WithURL(), err
}

func (ss *sqlStore) Delete(ctx context.Context, uid string, orgID int64) error {
	return ss.db.WithDbSession(ctx, func(sess *db.Session) error {
		_, err := sess.Exec("DELETE FROM folder WHERE uid=? AND org_id=?", uid, orgID)
		if err != nil {
			return folder.ErrDatabaseError.Errorf("failed to delete folder: %w", err)
		}
		return nil
	})
}

func (ss *sqlStore) Update(ctx context.Context, cmd folder.UpdateFolderCommand) (*folder.Folder, error) {
	updated := time.Now()
	uid := cmd.UID

	var foldr *folder.Folder

	if cmd.NewDescription == nil && cmd.NewTitle == nil && cmd.NewParentUID == nil {
		return nil, folder.ErrBadRequest.Errorf("nothing to update")
	}
	err := ss.db.WithDbSession(ctx, func(sess *db.Session) error {
		sql := strings.Builder{}
		sql.WriteString("UPDATE folder SET ")
		columnsToUpdate := []string{"updated = ?"}
		args := []any{updated}
		if cmd.NewDescription != nil {
			columnsToUpdate = append(columnsToUpdate, "description = ?")
			args = append(args, *cmd.NewDescription)
		}

		if cmd.NewTitle != nil {
			columnsToUpdate = append(columnsToUpdate, "title = ?")
			args = append(args, *cmd.NewTitle)
		}

		if cmd.NewParentUID != nil {
			if *cmd.NewParentUID == "" {
				columnsToUpdate = append(columnsToUpdate, "parent_uid = NULL")
			} else {
				columnsToUpdate = append(columnsToUpdate, "parent_uid = ?")
				args = append(args, *cmd.NewParentUID)
			}
		}

		if len(columnsToUpdate) == 0 {
			return folder.ErrBadRequest.Errorf("no columns to update")
		}

		sql.WriteString(strings.Join(columnsToUpdate, ", "))
		sql.WriteString(" WHERE uid = ? AND org_id = ?")
		args = append(args, cmd.UID, cmd.OrgID)

		args = append([]any{sql.String()}, args...)

		res, err := sess.Exec(args...)
		if err != nil {
			return folder.ErrDatabaseError.Errorf("failed to update folder: %w", err)
		}

		affected, err := res.RowsAffected()
		if err != nil {
			return folder.ErrInternal.Errorf("failed to get affected row: %w", err)
		}
		if affected == 0 {
			return folder.ErrInternal.Errorf("no folders are updated: %w", folder.ErrFolderNotFound)
		}

		foldr, err = ss.Get(ctx, folder.GetFolderQuery{
			UID:   &uid,
			OrgID: cmd.OrgID,
		})
		if err != nil {
			return err
		}
		return nil
	})

	return foldr.WithURL(), err
}

func (ss *sqlStore) Get(ctx context.Context, q folder.GetFolderQuery) (*folder.Folder, error) {
	foldr := &folder.Folder{}
	err := ss.db.WithDbSession(ctx, func(sess *db.Session) error {
		exists := false
		var err error
		switch {
		case q.UID != nil:
			exists, err = sess.SQL("SELECT * FROM folder WHERE uid = ? AND org_id = ?", q.UID, q.OrgID).Get(foldr)
		// nolint:staticcheck
		case q.ID != nil:
			metrics.MFolderIDsServiceCount.WithLabelValues(metrics.Folder).Inc()
			exists, err = sess.SQL("SELECT * FROM folder WHERE id = ?", q.ID).Get(foldr)
		case q.Title != nil:
			s := strings.Builder{}
			s.WriteString("SELECT * FROM folder WHERE title = ? AND org_id = ?")
			args := []any{*q.Title, q.OrgID}
			if q.ParentUID != nil {
				s.WriteString(" AND parent_uid = ?")
				args = append(args, *q.ParentUID)
			} else {
				s.WriteString(" AND parent_uid IS NULL")
			}
			exists, err = sess.SQL(s.String(), args...).Get(foldr)
		default:
			return folder.ErrBadRequest.Errorf("one of ID, UID, or Title must be included in the command")
		}
		if err != nil {
			return folder.ErrDatabaseError.Errorf("failed to get folder: %w", err)
		}
		if !exists {
			// embed dashboards.ErrFolderNotFound
			return folder.ErrFolderNotFound.Errorf("%w", dashboards.ErrFolderNotFound)
		}
		return nil
	})

	return foldr.WithURL(), err
}

func (ss *sqlStore) GetParents(ctx context.Context, q folder.GetParentsQuery) ([]*folder.Folder, error) {
	if q.UID == "" {
		return []*folder.Folder{}, nil
	}
	var folders []*folder.Folder

	recQuery := `
		WITH RECURSIVE RecQry AS (
			SELECT * FROM folder WHERE uid = ? AND org_id = ?
			UNION ALL SELECT f.* FROM folder f INNER JOIN RecQry r ON f.uid = r.parent_uid and f.org_id = r.org_id
		)
		SELECT * FROM RecQry;
	`

	recursiveQueriesAreSupported, err := ss.db.RecursiveQueriesAreSupported()
	if err != nil {
		return nil, err
	}
	switch recursiveQueriesAreSupported {
	case true:
		if err := ss.db.WithDbSession(ctx, func(sess *db.Session) error {
			err := sess.SQL(recQuery, q.UID, q.OrgID).Find(&folders)
			if err != nil {
				return folder.ErrDatabaseError.Errorf("failed to get folder parents: %w", err)
			}
			return nil
		}); err != nil {
			return nil, err
		}

		if err := concurrency.ForEachJob(ctx, len(folders), runtime.NumCPU(), func(ctx context.Context, idx int) error {
			folders[idx].WithURL()
			return nil
		}); err != nil {
			ss.log.Debug("failed to set URL to folders", "err", err)
		}
	default:
		ss.log.Debug("recursive CTE subquery is not supported; it fallbacks to the iterative implementation")
		return ss.getParentsMySQL(ctx, q)
	}

	if len(folders) < 1 {
		// the query is expected to return at least the same folder
		// if it's empty it means that the folder does not exist
		return nil, folder.ErrFolderNotFound
	}

	return util.Reverse(folders[1:]), nil
}

func (ss *sqlStore) GetChildren(ctx context.Context, q folder.GetChildrenQuery) ([]*folder.Folder, error) {
	var folders []*folder.Folder

	err := ss.db.WithDbSession(ctx, func(sess *db.Session) error {
		sql := strings.Builder{}
		args := make([]any, 0, 2)
		if q.UID == "" {
			sql.WriteString("SELECT * FROM folder WHERE parent_uid IS NULL AND org_id=?")
			args = append(args, q.OrgID)
		} else {
			sql.WriteString("SELECT * FROM folder WHERE parent_uid=? AND org_id=?")
			args = append(args, q.UID, q.OrgID)
		}

		if q.FolderUIDs != nil {
			sql.WriteString(" AND uid IN (?")
			for range q.FolderUIDs[1:] {
				sql.WriteString(", ?")
			}
			sql.WriteString(")")
			for _, uid := range q.FolderUIDs {
				args = append(args, uid)
			}
		}
		sql.WriteString(" ORDER BY title ASC")

		if q.Limit != 0 {
			var offset int64 = 0
			if q.Page > 0 {
				offset = q.Limit * (q.Page - 1)
			}
			sql.WriteString(ss.db.GetDialect().LimitOffset(q.Limit, offset))
		}
		err := sess.SQL(sql.String(), args...).Find(&folders)
		if err != nil {
			return folder.ErrDatabaseError.Errorf("failed to get folder children: %w", err)
		}

		if err := concurrency.ForEachJob(ctx, len(folders), runtime.NumCPU(), func(ctx context.Context, idx int) error {
			folders[idx].WithURL()
			return nil
		}); err != nil {
			ss.log.Debug("failed to set URL to folders", "err", err)
		}
		return nil
	})
	return folders, err
}

func (ss *sqlStore) getParentsMySQL(ctx context.Context, q folder.GetParentsQuery) (folders []*folder.Folder, err error) {
	err = ss.db.WithDbSession(ctx, func(sess *db.Session) error {
		uid := ""
		ok, err := sess.SQL("SELECT parent_uid FROM folder WHERE org_id=? AND uid=?", q.OrgID, q.UID).Get(&uid)
		if err != nil {
			return err
		}
		if !ok {
			return folder.ErrFolderNotFound
		}
		for {
			f := &folder.Folder{}
			ok, err := sess.SQL("SELECT * FROM folder WHERE org_id=? AND uid=?", q.OrgID, uid).Get(f)
			if err != nil {
				return err
			}
			if !ok {
				break
			}

			folders = append(folders, f.WithURL())
			uid = f.ParentUID
			if len(folders) > folder.MaxNestedFolderDepth {
				return folder.ErrMaximumDepthReached.Errorf("failed to get parent folders iteratively")
			}
		}
		return nil
	})
	return util.Reverse(folders), err
}

func (ss *sqlStore) GetHeight(ctx context.Context, foldrUID string, orgID int64, parentUID *string) (int, error) {
	height := -1
	queue := []string{foldrUID}
	for len(queue) > 0 && height <= folder.MaxNestedFolderDepth {
		length := len(queue)
		height++
		for i := 0; i < length; i++ {
			ele := queue[0]
			queue = queue[1:]
			if parentUID != nil && *parentUID == ele {
				return 0, folder.ErrCircularReference
			}
			folders, err := ss.GetChildren(ctx, folder.GetChildrenQuery{UID: ele, OrgID: orgID})
			if err != nil {
				return 0, err
			}
			for _, f := range folders {
				queue = append(queue, f.UID)
			}
		}
	}
	if height > folder.MaxNestedFolderDepth {
		ss.log.Warn("folder height exceeds the maximum allowed depth, You might have a circular reference", "uid", foldrUID, "orgId", orgID, "maxDepth", folder.MaxNestedFolderDepth)
	}
	return height, nil
}

// GetFolders returns org folders by their UIDs.
// If UIDs is empty, it returns all folders in the org.
// If WithFullpath is true it computes also the full path of a folder.
// The full path is a string that contains the titles of all parent folders separated by a slash.
// For example, if the folder structure is:
//
//	A
//	└── B
//	    └── C
//
// The full path of C is "A/B/C".
// The full path of B is "A/B".
// The full path of A is "A".
// If a folder contains a slash in its title, it is escaped with a backslash.
// For example, if the folder structure is:
//
//	A
//	└── B/C
//
// The full path of C is "A/B\/C".
//
// If FullpathUIDs is true it computes a string that contains the UIDs of all parent folders separated by slash.
// For example, if the folder structure is:
//
//	A (uid: "uid1")
//	└── B (uid: "uid2")
//	    └── C (uid: "uid3")
//
// The full path UIDs of C is "uid1/uid2/uid3".
// The full path UIDs of B is "uid1/uid2".
// The full path UIDs of A is "uid1".
func (ss *sqlStore) GetFolders(ctx context.Context, q getFoldersQuery) ([]*folder.Folder, error) {
	if q.BatchSize == 0 {
		q.BatchSize = DEFAULT_BATCH_SIZE
	}

	var folders []*folder.Folder
	if err := ss.db.WithDbSession(ctx, func(sess *db.Session) error {
		return batch(len(q.UIDs), int(q.BatchSize), func(start, end int) error {
			partialFolders := make([]*folder.Folder, 0, q.BatchSize)
			partialUIDs := q.UIDs[start:min(end, len(q.UIDs))]
			s := strings.Builder{}
			s.WriteString(`SELECT f0.id, f0.org_id, f0.uid, f0.parent_uid, f0.title, f0.description, f0.created, f0.updated`)
			// compute full path column if requested
			if q.WithFullpath {
				s.WriteString(fmt.Sprintf(`, %s AS fullpath`, getFullpathSQL(ss.db.GetDialect())))
			}
			// compute full path UIDs column if requested
			if q.WithFullpathUIDs {
				s.WriteString(fmt.Sprintf(`, %s AS fullpath_uids`, getFullapathUIDsSQL(ss.db.GetDialect())))
			}
			s.WriteString(` FROM folder f0`)
			// join the same table multiple times to compute the full path of a folder
			if q.WithFullpath || q.WithFullpathUIDs || len(q.ancestorUIDs) > 0 {
				s.WriteString(getFullpathJoinsSQL())
			}
			s.WriteString(` WHERE f0.org_id=?`)
			args := []any{q.OrgID}
			if len(partialUIDs) > 0 {
				s.WriteString(` AND f0.uid IN (?` + strings.Repeat(", ?", len(partialUIDs)-1) + `)`)
				for _, uid := range partialUIDs {
					args = append(args, uid)
				}
			}

			if len(q.ancestorUIDs) == 0 {
				err := sess.SQL(s.String(), args...).Find(&partialFolders)
				if err != nil {
					return err
				}
				folders = append(folders, partialFolders...)
				return nil
			}

			// filter out folders if they are not in the subtree of the given ancestor folders
			if err := batch(len(q.ancestorUIDs), int(q.BatchSize), func(start2, end2 int) error {
				s2, args2 := getAncestorsSQL(ss.db.GetDialect(), q.ancestorUIDs, start2, end2, s.String(), args)
				err := sess.SQL(s2, args2...).Find(&partialFolders)
				if err != nil {
					return err
				}
				folders = append(folders, partialFolders...)
				return nil
			}); err != nil {
				return err
			}
			return nil
		})
	}); err != nil {
		return nil, err
	}

	// Add URLs
	for i, f := range folders {
		f.Fullpath = strings.TrimLeft(f.Fullpath, "/")
		f.FullpathUIDs = strings.TrimLeft(f.FullpathUIDs, "/")
		folders[i] = f.WithURL()
	}

	return folders, nil
}

func (ss *sqlStore) GetDescendants(ctx context.Context, orgID int64, ancestor_uid string) ([]*folder.Folder, error) {
	var folders []*folder.Folder
	if err := ss.db.WithDbSession(ctx, func(sess *db.Session) error {
		s := strings.Builder{}
		args := make([]any, 0, 1+folder.MaxNestedFolderDepth)
		args = append(args, orgID)
		s.WriteString(`SELECT f0.id, f0.org_id, f0.uid, f0.parent_uid, f0.title, f0.description, f0.created, f0.updated`)
		s.WriteString(` FROM folder f0`)
		s.WriteString(getFullpathJoinsSQL())
		s.WriteString(` WHERE f0.org_id=?`)
		s.WriteString(` AND (`)
		for i := 1; i <= folder.MaxNestedFolderDepth; i++ {
			if i > 1 {
				s.WriteString(` OR `)
			}
			s.WriteString(fmt.Sprintf(`f%d.uid=?`, i))
			args = append(args, ancestor_uid)
		}
		s.WriteString(`)`)
		return sess.SQL(s.String(), args...).Find(&folders)
	}); err != nil {
		return nil, err
	}

	// Add URLs
	for i, f := range folders {
		folders[i] = f.WithURL()
	}

	return folders, nil
}

func getFullpathSQL(dialect migrator.Dialect) string {
	concatCols := make([]string, 0, folder.MaxNestedFolderDepth)
	concatCols = append(concatCols, "COALESCE(REPLACE(f0.title, '/', '\\/'), '')")
	for i := 1; i <= folder.MaxNestedFolderDepth; i++ {
		concatCols = append([]string{fmt.Sprintf("COALESCE(REPLACE(f%d.title, '/', '\\/'), '')", i), "'/'"}, concatCols...)
	}
	return dialect.Concat(concatCols...)
}

func getFullapathUIDsSQL(dialect migrator.Dialect) string {
	concatCols := make([]string, 0, folder.MaxNestedFolderDepth)
	concatCols = append(concatCols, "COALESCE(f0.uid, '')")
	for i := 1; i <= folder.MaxNestedFolderDepth; i++ {
		concatCols = append([]string{fmt.Sprintf("COALESCE(f%d.uid, '')", i), "'/'"}, concatCols...)
	}
	return dialect.Concat(concatCols...)
}

// getFullpathJoinsSQL returns a SQL fragment that joins the same table multiple times to get the full path of a folder.
func getFullpathJoinsSQL() string {
	joins := make([]string, 0, folder.MaxNestedFolderDepth)
	for i := 1; i <= folder.MaxNestedFolderDepth; i++ {
		joins = append(joins, fmt.Sprintf(` LEFT JOIN folder f%d ON f%d.org_id = f%d.org_id AND f%d.uid = f%d.parent_uid`, i, i, i-1, i, i-1))
	}
	return strings.Join(joins, "\n")
}

func getAncestorsSQL(dialect migrator.Dialect, ancestorUIDs []string, start int, end int, origSQL string, origArgs []any) (string, []any) {
	s2 := strings.Builder{}
	s2.WriteString(origSQL)
	args2 := make([]any, 0, len(ancestorUIDs)*folder.MaxNestedFolderDepth)
	args2 = append(args2, origArgs...)

	partialAncestorUIDs := ancestorUIDs[start:min(end, len(ancestorUIDs))]
	partialArgs := make([]any, 0, len(partialAncestorUIDs))
	for _, uid := range partialAncestorUIDs {
		partialArgs = append(partialArgs, uid)
	}
	s2.WriteString(` AND ( f0.uid IN (?` + strings.Repeat(", ?", len(partialAncestorUIDs)-1) + `)`)
	args2 = append(args2, partialArgs...)
	for i := 1; i <= folder.MaxNestedFolderDepth; i++ {
		s2.WriteString(fmt.Sprintf(` OR f%d.uid IN (?`+strings.Repeat(", ?", len(partialAncestorUIDs)-1)+`)`, i))
		args2 = append(args2, partialArgs...)
	}
	s2.WriteString(` )`)
	return s2.String(), args2
}

func batch(count, batchSize int, eachFn func(start, end int) error) error {
	if count == 0 {
		if err := eachFn(0, 0); err != nil {
			return err
		}
		return nil
	}

	for i := 0; i < count; {
		end := i + batchSize
		if end > count {
			end = count
		}

		if err := eachFn(i, end); err != nil {
			return err
		}

		i = end
	}

	return nil
}
