package db

import (
	"context"

	"github.com/grafana/grafana/pkg/services/sqlstore"
	"github.com/grafana/grafana/pkg/services/sqlstore/migrator"
	"github.com/grafana/grafana/pkg/services/sqlstore/session"
)

type DB interface {
	WithTransactionalDbSession(ctx context.Context, callback sqlstore.DBTransactionFunc) error
	WithDbSession(ctx context.Context, callback sqlstore.DBTransactionFunc) error
	WithDbSessionForceNewSession(ctx context.Context, callback sqlstore.DBTransactionFunc) error
	GetDialect() migrator.Dialect
	GetSqlxSession() *session.SessionDB
	InTransaction(ctx context.Context, fn func(ctx context.Context) error) error
}
