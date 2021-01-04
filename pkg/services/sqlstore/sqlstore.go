package sqlstore

import (
	"context"
	"fmt"
	"net/url"
	"os"
	"path"
	"path/filepath"
	"strings"
	"time"

	"github.com/go-sql-driver/mysql"
	"github.com/grafana/grafana/pkg/bus"
	"github.com/grafana/grafana/pkg/infra/fs"
	"github.com/grafana/grafana/pkg/infra/localcache"
	"github.com/grafana/grafana/pkg/infra/log"
	"github.com/grafana/grafana/pkg/models"
	"github.com/grafana/grafana/pkg/registry"
	"github.com/grafana/grafana/pkg/services/annotations"
	"github.com/grafana/grafana/pkg/services/sqlstore/migrations"
	"github.com/grafana/grafana/pkg/services/sqlstore/migrator"
	"github.com/grafana/grafana/pkg/services/sqlstore/sqlutil"
	"github.com/grafana/grafana/pkg/setting"
	_ "github.com/grafana/grafana/pkg/tsdb/mssql"
	"github.com/grafana/grafana/pkg/util"
	"github.com/grafana/grafana/pkg/util/errutil"
	_ "github.com/lib/pq"
	"xorm.io/xorm"
)

var (
	x       *xorm.Engine
	dialect migrator.Dialect

	sqlog log.Logger = log.New("sqlstore")
)

// ContextSessionKey is used as key to save values in `context.Context`
type ContextSessionKey struct{}

const ServiceName = "SqlStore"
const InitPriority = registry.High

func init() {
	ss := &SQLStore{}

	// This change will make xorm use an empty default schema for postgres and
	// by that mimic the functionality of how it was functioning before
	// xorm's changes above.
	xorm.DefaultPostgresSchema = ""

	registry.Register(&registry.Descriptor{
		Name:         ServiceName,
		Instance:     ss,
		InitPriority: InitPriority,
	})
}

type SQLStore struct {
	Cfg          *setting.Cfg             `inject:""`
	Bus          bus.Bus                  `inject:""`
	CacheService *localcache.CacheService `inject:""`

	dbCfg                       DatabaseConfig
	engine                      *xorm.Engine
	log                         log.Logger
	Dialect                     migrator.Dialect
	skipEnsureDefaultOrgAndUser bool
}

func (ss *SQLStore) Init() error {
	ss.log = log.New("sqlstore")
	ss.readConfig()

	engine, err := ss.getEngine()
	if err != nil {
		return errutil.Wrap("failed to connect to database", err)
	}

	ss.engine = engine
	ss.Dialect = migrator.NewDialect(ss.engine)

	// temporarily still set global var
	x = engine
	dialect = ss.Dialect

	migrator := migrator.NewMigrator(engine)
	migrations.AddMigrations(migrator)

	for _, descriptor := range registry.GetServices() {
		sc, ok := descriptor.Instance.(registry.DatabaseMigrator)
		if ok {
			sc.AddMigration(migrator)
		}
	}

	if err := migrator.Start(); err != nil {
		return errutil.Wrap("migration failed", err)
	}

	// Init repo instances
	annotations.SetRepository(&SQLAnnotationRepo{})
	annotations.SetAnnotationCleaner(&AnnotationCleanupService{batchSize: 100, log: log.New("annotationcleaner")})
	ss.Bus.SetTransactionManager(ss)

	// Register handlers
	ss.addUserQueryAndCommandHandlers()
	ss.addAlertNotificationUidByIdHandler()
	ss.addPreferencesQueryAndCommandHandlers()

	if ss.skipEnsureDefaultOrgAndUser {
		return nil
	}

	return ss.ensureMainOrgAndAdminUser()
}

func (ss *SQLStore) ensureMainOrgAndAdminUser() error {
	err := ss.InTransaction(context.Background(), func(ctx context.Context) error {
		ss.log.Debug("Ensuring main org and admin user exist")
		var stats models.SystemUserCountStats
		err := ss.WithDbSession(ctx, func(sess *DBSession) error {
			// TODO: Should be able to rename "Count" to "count", for more standard SQL style
			// Just have to make sure it gets deserialized properly into models.SystemUserCountStats
			rawSQL := `SELECT COUNT(id) AS Count FROM ` + dialect.Quote("user")
			if _, err := sess.SQL(rawSQL).Get(&stats); err != nil {
				return fmt.Errorf("could not determine if admin user exists: %w", err)
			}

			return nil
		})
		if err != nil {
			return err
		}

		if stats.Count > 0 {
			return nil
		}

		// ensure admin user
		if !ss.Cfg.DisableInitAdminCreation {
			ss.log.Debug("Creating default admin user")
			cmd := models.CreateUserCommand{
				Login:    ss.Cfg.AdminUser,
				Email:    ss.Cfg.AdminUser + "@localhost",
				Password: ss.Cfg.AdminPassword,
				IsAdmin:  true,
			}
			if err := bus.DispatchCtx(ctx, &cmd); err != nil {
				return fmt.Errorf("failed to create admin user: %s", err)
			}

			ss.log.Info("Created default admin", "user", ss.Cfg.AdminUser)
			return nil
		}

		// ensure default org even if default admin user is disabled
		if err := inTransactionCtx(ctx, func(sess *DBSession) error {
			_, err := getOrCreateOrg(sess, mainOrgName)
			return err
		}); err != nil {
			return fmt.Errorf("failed to create default organization: %w", err)
		}

		ss.log.Info("Created default organization")
		return nil
	})

	return err
}

func (ss *SQLStore) buildExtraConnectionString(sep rune) string {
	if ss.dbCfg.UrlQueryParams == nil {
		return ""
	}

	var sb strings.Builder
	for key, values := range ss.dbCfg.UrlQueryParams {
		for _, value := range values {
			sb.WriteRune(sep)
			sb.WriteString(key)
			sb.WriteRune('=')
			sb.WriteString(value)
		}
	}
	return sb.String()
}

func (ss *SQLStore) buildConnectionString() (string, error) {
	cnnstr := ss.dbCfg.ConnectionString

	// special case used by integration tests
	if cnnstr != "" {
		return cnnstr, nil
	}

	switch ss.dbCfg.Type {
	case migrator.MySQL:
		protocol := "tcp"
		if strings.HasPrefix(ss.dbCfg.Host, "/") {
			protocol = "unix"
		}

		cnnstr = fmt.Sprintf("%s:%s@%s(%s)/%s?collation=utf8mb4_unicode_ci&allowNativePasswords=true",
			ss.dbCfg.User, ss.dbCfg.Pwd, protocol, ss.dbCfg.Host, ss.dbCfg.Name)

		if ss.dbCfg.SslMode == "true" || ss.dbCfg.SslMode == "skip-verify" {
			tlsCert, err := makeCert(ss.dbCfg)
			if err != nil {
				return "", err
			}
			if err := mysql.RegisterTLSConfig("custom", tlsCert); err != nil {
				return "", err
			}

			cnnstr += "&tls=custom"
		}

		cnnstr += ss.buildExtraConnectionString('&')
	case migrator.Postgres:
		addr, err := util.SplitHostPortDefault(ss.dbCfg.Host, "127.0.0.1", "5432")
		if err != nil {
			return "", errutil.Wrapf(err, "Invalid host specifier '%s'", ss.dbCfg.Host)
		}

		if ss.dbCfg.Pwd == "" {
			ss.dbCfg.Pwd = "''"
		}
		if ss.dbCfg.User == "" {
			ss.dbCfg.User = "''"
		}
		cnnstr = fmt.Sprintf("user=%s password=%s host=%s port=%s dbname=%s sslmode=%s sslcert=%s sslkey=%s sslrootcert=%s",
			ss.dbCfg.User, ss.dbCfg.Pwd, addr.Host, addr.Port, ss.dbCfg.Name, ss.dbCfg.SslMode, ss.dbCfg.ClientCertPath,
			ss.dbCfg.ClientKeyPath, ss.dbCfg.CaCertPath)

		cnnstr += ss.buildExtraConnectionString(' ')
	case migrator.SQLite:
		// special case for tests
		if !filepath.IsAbs(ss.dbCfg.Path) {
			ss.dbCfg.Path = filepath.Join(ss.Cfg.DataPath, ss.dbCfg.Path)
		}
		if err := os.MkdirAll(path.Dir(ss.dbCfg.Path), os.ModePerm); err != nil {
			return "", err
		}

		cnnstr = fmt.Sprintf("file:%s?cache=%s&mode=rwc", ss.dbCfg.Path, ss.dbCfg.CacheMode)
		cnnstr += ss.buildExtraConnectionString('&')
	default:
		return "", fmt.Errorf("unknown database type: %s", ss.dbCfg.Type)
	}

	return cnnstr, nil
}

func (ss *SQLStore) getEngine() (*xorm.Engine, error) {
	connectionString, err := ss.buildConnectionString()
	if err != nil {
		return nil, err
	}

	sqlog.Info("Connecting to DB", "dbtype", ss.dbCfg.Type)
	if ss.dbCfg.Type == migrator.SQLite && strings.HasPrefix(connectionString, "file:") {
		exists, err := fs.Exists(ss.dbCfg.Path)
		if err != nil {
			return nil, errutil.Wrapf(err, "can't check for existence of %q", ss.dbCfg.Path)
		}

		const perms = 0640
		if !exists {
			ss.log.Info("Creating SQLite database file", "path", ss.dbCfg.Path)
			f, err := os.OpenFile(ss.dbCfg.Path, os.O_CREATE|os.O_RDWR, perms)
			if err != nil {
				return nil, errutil.Wrapf(err, "failed to create SQLite database file %q", ss.dbCfg.Path)
			}
			if err := f.Close(); err != nil {
				return nil, errutil.Wrapf(err, "failed to create SQLite database file %q", ss.dbCfg.Path)
			}
		} else {
			fi, err := os.Lstat(ss.dbCfg.Path)
			if err != nil {
				return nil, errutil.Wrapf(err, "failed to stat SQLite database file %q", ss.dbCfg.Path)
			}
			m := fi.Mode() & os.ModePerm
			if m|perms != perms {
				ss.log.Warn("SQLite database file has broader permissions than it should",
					"path", ss.dbCfg.Path, "mode", m, "expected", os.FileMode(perms))
			}
		}
	}
	engine, err := xorm.NewEngine(ss.dbCfg.Type, connectionString)
	if err != nil {
		return nil, err
	}

	engine.SetMaxOpenConns(ss.dbCfg.MaxOpenConn)
	engine.SetMaxIdleConns(ss.dbCfg.MaxIdleConn)
	engine.SetConnMaxLifetime(time.Second * time.Duration(ss.dbCfg.ConnMaxLifetime))

	// configure sql logging
	debugSQL := ss.Cfg.Raw.Section("database").Key("log_queries").MustBool(false)
	if !debugSQL {
		engine.SetLogger(&xorm.DiscardLogger{})
	} else {
		engine.SetLogger(NewXormLogger(log.LvlInfo, log.New("sqlstore.xorm")))
		engine.ShowSQL(true)
		engine.ShowExecTime(true)
	}

	return engine, nil
}

func (ss *SQLStore) readConfig() {
	sec := ss.Cfg.Raw.Section("database")

	cfgURL := sec.Key("url").String()
	if len(cfgURL) != 0 {
		dbURL, _ := url.Parse(cfgURL)
		ss.dbCfg.Type = dbURL.Scheme
		ss.dbCfg.Host = dbURL.Host

		pathSplit := strings.Split(dbURL.Path, "/")
		if len(pathSplit) > 1 {
			ss.dbCfg.Name = pathSplit[1]
		}

		userInfo := dbURL.User
		if userInfo != nil {
			ss.dbCfg.User = userInfo.Username()
			ss.dbCfg.Pwd, _ = userInfo.Password()
		}

		ss.dbCfg.UrlQueryParams = dbURL.Query()
	} else {
		ss.dbCfg.Type = sec.Key("type").String()
		ss.dbCfg.Host = sec.Key("host").String()
		ss.dbCfg.Name = sec.Key("name").String()
		ss.dbCfg.User = sec.Key("user").String()
		ss.dbCfg.ConnectionString = sec.Key("connection_string").String()
		ss.dbCfg.Pwd = sec.Key("password").String()
	}

	ss.dbCfg.MaxOpenConn = sec.Key("max_open_conn").MustInt(0)
	ss.dbCfg.MaxIdleConn = sec.Key("max_idle_conn").MustInt(2)
	ss.dbCfg.ConnMaxLifetime = sec.Key("conn_max_lifetime").MustInt(14400)

	ss.dbCfg.SslMode = sec.Key("ssl_mode").String()
	ss.dbCfg.CaCertPath = sec.Key("ca_cert_path").String()
	ss.dbCfg.ClientKeyPath = sec.Key("client_key_path").String()
	ss.dbCfg.ClientCertPath = sec.Key("client_cert_path").String()
	ss.dbCfg.ServerCertName = sec.Key("server_cert_name").String()
	ss.dbCfg.Path = sec.Key("path").MustString("data/grafana.db")

	ss.dbCfg.CacheMode = sec.Key("cache_mode").MustString("private")
}

// ITestDB is an interface of arguments for testing db
type ITestDB interface {
	Helper()
	Fatalf(format string, args ...interface{})
	Logf(format string, args ...interface{})
}

var testSQLStore *SQLStore

// InitTestDB initializes the test DB.
func InitTestDB(t ITestDB) *SQLStore {
	t.Helper()
	if testSQLStore == nil {
		testSQLStore = &SQLStore{}
		testSQLStore.Bus = bus.New()
		testSQLStore.CacheService = localcache.New(5*time.Minute, 10*time.Minute)
		testSQLStore.skipEnsureDefaultOrgAndUser = false

		dbType := migrator.SQLite

		// environment variable present for test db?
		if db, present := os.LookupEnv("GRAFANA_TEST_DB"); present {
			t.Logf("Using database type %q", db)
			dbType = db
		}

		// set test db config
		testSQLStore.Cfg = setting.NewCfg()
		sec, err := testSQLStore.Cfg.Raw.NewSection("database")
		if err != nil {
			t.Fatalf("Failed to create section: %s", err)
		}
		if _, err := sec.NewKey("type", dbType); err != nil {
			t.Fatalf("Failed to create key: %s", err)
		}

		switch dbType {
		case "mysql":
			if _, err := sec.NewKey("connection_string", sqlutil.MySQLTestDB().ConnStr); err != nil {
				t.Fatalf("Failed to create key: %s", err)
			}
		case "postgres":
			if _, err := sec.NewKey("connection_string", sqlutil.PostgresTestDB().ConnStr); err != nil {
				t.Fatalf("Failed to create key: %s", err)
			}
		default:
			if _, err := sec.NewKey("connection_string", sqlutil.SQLite3TestDB().ConnStr); err != nil {
				t.Fatalf("Failed to create key: %s", err)
			}
		}

		// need to get engine to clean db before we init
		t.Logf("Creating database connection: %q", sec.Key("connection_string"))
		engine, err := xorm.NewEngine(dbType, sec.Key("connection_string").String())
		if err != nil {
			t.Fatalf("Failed to init test database: %v", err)
		}

		testSQLStore.Dialect = migrator.NewDialect(engine)

		// temp global var until we get rid of global vars
		dialect = testSQLStore.Dialect

		t.Logf("Cleaning DB")
		if err := dialect.CleanDB(); err != nil {
			t.Fatalf("Failed to clean test db %v", err)
		}

		if err := testSQLStore.Init(); err != nil {
			t.Fatalf("Failed to init test database: %v", err)
		}

		testSQLStore.engine.DatabaseTZ = time.UTC
		testSQLStore.engine.TZLocation = time.UTC
	}

	if err := dialect.TruncateDBTables(); err != nil {
		t.Fatalf("Failed to truncate test db %v", err)
	}

	return testSQLStore
}

func IsTestDbMySQL() bool {
	if db, present := os.LookupEnv("GRAFANA_TEST_DB"); present {
		return db == migrator.MySQL
	}

	return false
}

func IsTestDbPostgres() bool {
	if db, present := os.LookupEnv("GRAFANA_TEST_DB"); present {
		return db == migrator.Postgres
	}

	return false
}

type DatabaseConfig struct {
	Type             string
	Host             string
	Name             string
	User             string
	Pwd              string
	Path             string
	SslMode          string
	CaCertPath       string
	ClientKeyPath    string
	ClientCertPath   string
	ServerCertName   string
	ConnectionString string
	MaxOpenConn      int
	MaxIdleConn      int
	ConnMaxLifetime  int
	CacheMode        string
	UrlQueryParams   map[string][]string
}
