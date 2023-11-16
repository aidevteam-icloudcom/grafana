package registry

import (
	"context"
	"sync"

	"github.com/grafana/grafana/pkg/infra/log"
	"github.com/grafana/grafana/pkg/infra/slugify"
	"github.com/grafana/grafana/pkg/services/extsvcauth"
	"github.com/grafana/grafana/pkg/services/extsvcauth/oauthserver/oasimpl"
	"github.com/grafana/grafana/pkg/services/featuremgmt"
	"github.com/grafana/grafana/pkg/services/serviceaccounts/extsvcaccounts"
)

var _ extsvcauth.ExternalServiceRegistry = &Registry{}

type Registry struct {
	features featuremgmt.FeatureToggles
	logger   log.Logger
	oauthReg extsvcauth.ExternalServiceRegistry
	saReg    extsvcauth.ExternalServiceRegistry

	extSvcProviders map[string]extsvcauth.AuthProvider
	lock            sync.Mutex
}

func ProvideExtSvcRegistry(oauthServer *oasimpl.OAuth2ServiceImpl, saSvc *extsvcaccounts.ExtSvcAccountsService, features featuremgmt.FeatureToggles) *Registry {
	return &Registry{
		extSvcProviders: map[string]extsvcauth.AuthProvider{},
		features:        features,
		lock:            sync.Mutex{},
		logger:          log.New("extsvcauth.registry"),
		oauthReg:        oauthServer,
		saReg:           saSvc,
	}
}

// CleanUpOrphanedExternalServices remove external services present in store that have not been registered on startup.
func (r *Registry) CleanUpOrphanedExternalServices(ctx context.Context) error {
	extsvcs, err := r.retrieveExtSvcProviders(ctx)
	if err != nil {
		r.logger.Error("Could not retrieve external services from store", "error", err.Error())
		return err
	}
	for name, provider := range extsvcs {
		// The service did not register this time. Removed.
		if _, ok := r.extSvcProviders[slugify.Slugify(name)]; !ok {
			r.logger.Info("Detected removed External Service", "service", name, "provider", provider)
			switch provider {
			case extsvcauth.ServiceAccounts:
				if err := r.saReg.RemoveExternalService(ctx, name); err != nil {
					return err
				}
			case extsvcauth.OAuth2Server:
				if err := r.oauthReg.RemoveExternalService(ctx, name); err != nil {
					return err
				}
			}
		}
	}
	return nil
}

// HasExternalService returns whether an external service has been saved with that name.
func (r *Registry) HasExternalService(ctx context.Context, name string) (bool, error) {
	_, ok := r.extSvcProviders[slugify.Slugify(name)]
	return ok, nil
}

// GetExternalServiceNames returns the list of external services registered in store.
func (r *Registry) GetExternalServiceNames(ctx context.Context) ([]string, error) {
	extSvcProviders, err := r.retrieveExtSvcProviders(ctx)
	if err != nil {
		return nil, err
	}
	names := []string{}
	for s := range extSvcProviders {
		names = append(names, s)
	}
	return names, nil
}

// RemoveExternalService removes an external service and its associated resources from the database (ex: service account, token).
func (r *Registry) RemoveExternalService(ctx context.Context, name string) error {
	provider, ok := r.extSvcProviders[slugify.Slugify(name)]
	if !ok {
		r.logger.Debug("external service not found", "service", name)
		return nil
	}

	switch provider {
	case extsvcauth.ServiceAccounts:
		if !r.features.IsEnabled(ctx, featuremgmt.FlagExternalServiceAccounts) {
			r.logger.Debug("Skipping External Service removal, flag disabled", "service", name, "flag", featuremgmt.FlagExternalServiceAccounts)
			return nil
		}
		r.logger.Debug("Routing External Service removal to the External Service Account service", "service", name)
		return r.saReg.RemoveExternalService(ctx, name)
	case extsvcauth.OAuth2Server:
		if !r.features.IsEnabled(ctx, featuremgmt.FlagExternalServiceAuth) {
			r.logger.Debug("Skipping External Service removal, flag disabled", "service", name, "flag", featuremgmt.FlagExternalServiceAccounts)
			return nil
		}
		r.logger.Debug("Routing External Service removal to the OAuth2Server", "service", name)
		return r.oauthReg.RemoveExternalService(ctx, name)
	default:
		return extsvcauth.ErrUnknownProvider.Errorf("unknow provider '%v'", provider)
	}
}

// SaveExternalService creates or updates an external service in the database. Based on the requested auth provider,
// it generates client_id, secrets and any additional provider specificities (ex: rsa keys). It also ensures that the
// associated service account has the correct permissions.
func (r *Registry) SaveExternalService(ctx context.Context, cmd *extsvcauth.ExternalServiceRegistration) (*extsvcauth.ExternalService, error) {
	// Record provider in case of removal
	r.lock.Lock()
	r.extSvcProviders[slugify.Slugify(cmd.Name)] = cmd.AuthProvider
	r.lock.Unlock()

	switch cmd.AuthProvider {
	case extsvcauth.ServiceAccounts:
		if !r.features.IsEnabled(ctx, featuremgmt.FlagExternalServiceAccounts) {
			r.logger.Warn("Skipping External Service authentication, flag disabled", "service", cmd.Name, "flag", featuremgmt.FlagExternalServiceAccounts)
			return nil, nil
		}
		r.logger.Debug("Routing the External Service registration to the External Service Account service", "service", cmd.Name)
		return r.saReg.SaveExternalService(ctx, cmd)
	case extsvcauth.OAuth2Server:
		if !r.features.IsEnabled(ctx, featuremgmt.FlagExternalServiceAuth) {
			r.logger.Warn("Skipping External Service authentication, flag disabled", "service", cmd.Name, "flag", featuremgmt.FlagExternalServiceAuth)
			return nil, nil
		}
		r.logger.Debug("Routing the External Service registration to the OAuth2Server", "service", cmd.Name)
		return r.oauthReg.SaveExternalService(ctx, cmd)
	default:
		return nil, extsvcauth.ErrUnknownProvider.Errorf("unknow provider '%v'", cmd.AuthProvider)
	}
}

// retrieveExtSvcProviders fetches external services from store and map their associated provider
func (r *Registry) retrieveExtSvcProviders(ctx context.Context) (map[string]extsvcauth.AuthProvider, error) {
	extsvcs := map[string]extsvcauth.AuthProvider{}
	if r.features.IsEnabled(featuremgmt.FlagExternalServiceAccounts) {
		names, err := r.saReg.GetExternalServiceNames(ctx)
		if err != nil {
			return nil, err
		}
		for i := range names {
			extsvcs[names[i]] = extsvcauth.ServiceAccounts
		}
	}
	// Important to run this second as the OAuth server uses External Service Accounts as well.
	if r.features.IsEnabled(featuremgmt.FlagExternalServiceAuth) {
		names, err := r.oauthReg.GetExternalServiceNames(ctx)
		if err != nil {
			return nil, err
		}
		for i := range names {
			extsvcs[names[i]] = extsvcauth.OAuth2Server
		}
	}
	return extsvcs, nil
}

func (r *Registry) Run(ctx context.Context) error {
	// This is a one-time background job.
	// Cleans up external services that have not been registered this time.
	return r.CleanUpOrphanedExternalServices(ctx)
}
