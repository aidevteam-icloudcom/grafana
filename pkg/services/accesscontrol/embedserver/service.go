package embedserver

import (
	"context"
	"time"

	"github.com/openfga/openfga/pkg/logger"
	"go.uber.org/zap/zapcore"

	"github.com/grafana/zanzana/pkg/schema"
	zanzanaService "github.com/grafana/zanzana/pkg/service"

	"github.com/grafana/grafana/pkg/infra/log"
	"github.com/grafana/grafana/pkg/services/featuremgmt"
	"github.com/grafana/grafana/pkg/setting"
)

type ServiceCfg struct {
	// SingleRead is a flag to enable single read
	// Overrides all other flags
	SingleRead bool
	// DashboardReadResult is a flag to enable dashboard read result from Zanzana
	DashboardReadResult bool
	// EvaluationResult is a flag to enable evaluation result from Zanzana
	EvaluationResult bool
	// OpenFGA log level (debug, info, warn, error, dpanic, panic, fatal)
	LogLevel string

	ListenHTTP                 bool
	MaxConcurrentReadsForCheck uint32
	ResolveNodeLimit           uint32

	// Enables caching of Check results for the Check and List objects APIs
	CheckQueryCacheEnabled bool
	// sets the cache size limit (in items)
	CheckQueryCacheLimit uint32
	CheckQueryCacheTTL   time.Duration
}

type Service struct {
	*zanzanaService.Service
	cfg      *setting.Cfg
	features featuremgmt.FeatureToggles
	log      log.Logger
	Cfg      *ServiceCfg
}

func ProvideService(cfg *setting.Cfg, features featuremgmt.FeatureToggles) (*Service, error) {
	section := cfg.SectionWithEnvOverrides("zanzana")
	s := &Service{
		cfg:      cfg,
		features: features,
		log:      log.New("accesscontrol.zanzana"),
		Cfg: &ServiceCfg{
			SingleRead:                 section.Key("single_read").MustBool(false),
			DashboardReadResult:        section.Key("dashboard_read_result").MustBool(false),
			EvaluationResult:           section.Key("evaluation_result").MustBool(false),
			LogLevel:                   section.Key("log_level").MustString("info"),
			ListenHTTP:                 section.Key("listen_http").MustBool(true),
			MaxConcurrentReadsForCheck: uint32(section.Key("max_concurrent_reads_for_check").MustUint(0)),
			ResolveNodeLimit:           uint32(section.Key("resolve_node_limit").MustUint(0)),
			CheckQueryCacheEnabled:     section.Key("check_query_cache_enabled").MustBool(true),
			CheckQueryCacheLimit:       uint32(section.Key("check_query_cache_limit").MustUint(0)),
			CheckQueryCacheTTL:         time.Duration(section.Key("check_query_cache_ttl").MustInt(60) * int(time.Second)),
		},
	}

	// FIXME: Replace with zap compatible logger
	// logLevel := cfg.Raw.Section("log").Key("level").MustString("info")
	zapLogger := logger.MustNewLogger("text", s.Cfg.LogLevel, "ISO8601")

	ctx := context.Background()
	// Read the database configuration
	dbConfig, err := NewDatabaseConfig(cfg, features)
	if err != nil {
		return nil, err
	}

	dbConfig.ConnectionString += "&parseTime=true"

	zapLogger.Info("Database configuration", zapcore.Field{Key: "config", Type: zapcore.StringType, Interface: dbConfig.ConnectionString, String: dbConfig.ConnectionString})

	// Create the Zanzana service
	srv, err := zanzanaService.NewService(ctx, zapLogger, nil, &zanzanaService.Config{
		DBURI:                      dbConfig.ConnectionString,
		DBType:                     dbConfig.Type,
		MaxOpenConns:               dbConfig.MaxOpenConn,
		MaxIdleConns:               dbConfig.MaxIdleConn,
		ConnMaxLifetime:            time.Duration(dbConfig.ConnMaxLifetime * int(time.Second)),
		ConnMaxIdleTime:            time.Duration(dbConfig.ConnMaxIdleTime * int(time.Second)),
		ListObjectsMaxResults:      1000,
		ListObjectsDeadline:        3 * time.Second,
		ListenHTTP:                 s.Cfg.ListenHTTP,
		MaxConcurrentReadsForCheck: s.Cfg.MaxConcurrentReadsForCheck,
		ResolveNodeLimit:           s.Cfg.ResolveNodeLimit,
	})
	if err != nil {
		return nil, err
	}

	s.Service = srv

	// move to seeder and take into account persistence
	dslBuf, err := schema.BuildModel(nil, schema.LoadResources())
	if err != nil {
		return nil, err
	}

	model, err := schema.TransformToModel(dslBuf.String())
	if err != nil {
		return nil, err
	}

	cl, err := srv.GetClient(ctx, "1")
	if err != nil {
		return nil, err
	}

	storeID, err := cl.GetOrCreateStoreID(ctx)
	if err != nil {
		return nil, err
	}

	err = cl.LoadModel(ctx, model)
	if err != nil {
		return nil, err
	}
	s.log.Info("Zanzana service started", "storeID", storeID)

	return s, nil
}
