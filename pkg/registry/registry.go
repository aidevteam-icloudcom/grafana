package registry

import (
	"context"
	"reflect"
	"sort"

	"github.com/grafana/grafana/pkg/services/sqlstore/migrator"
)

type Descriptor struct {
	Name         string
	Instance     Service
	InitPriority Priority
}

var services []*Descriptor

func RegisterService(instance Service) {
	services = append(services, &Descriptor{
		Name:         reflect.TypeOf(instance).Elem().Name(),
		Instance:     instance,
		InitPriority: Low,
	})
}

func Register(descriptor *Descriptor) {
	services = append(services, descriptor)
}

func GetServices() []*Descriptor {
	sort.Slice(services, func(i, j int) bool {
		return services[i].InitPriority > services[j].InitPriority
	})

	return services
}

type Service interface {
	Init() error
}

// Useful for alerting service
type CanBeDisabled interface {
	IsDisabled() bool
}

type BackgroundService interface {
	Run(ctx context.Context) error
}

// DatabaseMigrator allows the caller to add migrations to
// the migrator passed as argument
type DatabaseMigrator interface {

	// AddMigrations allows the service to add migrations to
	// the database migrator.
	AddMigration(mg *migrator.Migrator)
}

type HasInitPriority interface {
	GetInitPriority() Priority
}

func IsDisabled(srv Service) bool {
	canBeDisabled, ok := srv.(CanBeDisabled)
	return ok && canBeDisabled.IsDisabled()
}

type Priority int

const (
	High Priority = 100
	Low  Priority = 0
)
