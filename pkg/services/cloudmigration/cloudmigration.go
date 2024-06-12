package cloudmigration

import (
	"context"

	"github.com/grafana/grafana/pkg/services/gcom"
)

type Service interface {
	// GetToken Returns the cloud migration token if it exists.
	GetToken(ctx context.Context) (gcom.TokenView, error)
	// CreateToken Creates a cloud migration token.
	CreateToken(ctx context.Context) (CreateAccessTokenResponse, error)
	// ValidateToken Sends a request to CMS to test the token.
	ValidateToken(ctx context.Context, mig CloudMigrationSession) error
	DeleteToken(ctx context.Context, uid string) error

	CreateSession(ctx context.Context, req CloudMigrationSessionRequest) (*CloudMigrationSessionResponse, error)
	GetSession(ctx context.Context, migUID string) (*CloudMigrationSession, error)
	DeleteSession(ctx context.Context, migUID string) (*CloudMigrationSession, error)
	GetSessionList(context.Context) (*CloudMigrationSessionListResponse, error)

	RunMigration(ctx context.Context, migUID string) (*MigrateSnapshotResponseDTO, error)
	GetMigrationStatus(ctx context.Context, runUID string) (*Snapshot, error)
	GetMigrationRunList(ctx context.Context, migUID string) (*SnapshotList, error)
}
