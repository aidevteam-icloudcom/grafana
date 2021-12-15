package api

import (
	"context"
	"testing"

	apimodels "github.com/grafana/grafana/pkg/services/ngalert/api/tooling/definitions"
	"github.com/grafana/grafana/pkg/services/ngalert/models"
	"github.com/grafana/grafana/pkg/services/ngalert/notifier"
	"github.com/grafana/grafana/pkg/services/ngalert/store"
)

type FakeAlertmanagerProvider struct {
	alertmanagers map[int64]Alertmanager
}

func newAlertmanagerProvider(t *testing.T) *FakeAlertmanagerProvider {
	t.Helper()

	return &FakeAlertmanagerProvider{
		alertmanagers: map[int64]Alertmanager{},
	}
}

func (f FakeAlertmanagerProvider) Setup(orgID int64) {
	f.alertmanagers[orgID] = &FakeAlertmanager{}
}

func (f FakeAlertmanagerProvider) AlertmanagerFor(orgID int64) (Alertmanager, error) {
	if am, ok := f.alertmanagers[orgID]; ok {
		return am, nil
	}
	return nil, notifier.ErrNoAlertmanagerForOrg
}

type FakeAlertingStore struct {
	orgsWithConfig map[int64]bool
}

func newFakeAlertingStore(t *testing.T) FakeAlertingStore {
	t.Helper()

	return FakeAlertingStore{
		orgsWithConfig: map[int64]bool{},
	}
}

func (f FakeAlertingStore) Setup(orgID int64) {
	f.orgsWithConfig[orgID] = true
}

func (f FakeAlertingStore) GetLatestAlertmanagerConfiguration(query *models.GetLatestAlertmanagerConfigurationQuery) error {
	if _, ok := f.orgsWithConfig[query.OrgID]; ok {
		return nil
	}
	return store.ErrNoAlertmanagerConfiguration
}

type FakeAlertmanager struct{}

func (f FakeAlertmanager) SaveAndApplyConfig(config *apimodels.PostableUserConfig) error {
	return nil
}

func (f FakeAlertmanager) SaveAndApplyDefaultConfig() error {
	panic("not implemented")
}

func (f FakeAlertmanager) GetStatus() apimodels.GettableStatus {
	panic("not implemented")
}

func (f FakeAlertmanager) CreateSilence(ps *apimodels.PostableSilence) (string, error) {
	panic("not implemented")
}

func (f FakeAlertmanager) DeleteSilence(silenceID string) error {
	panic("not implemented")
}

func (f FakeAlertmanager) GetSilence(silenceID string) (apimodels.GettableSilence, error) {
	panic("not implemented")
}

func (f FakeAlertmanager) ListSilences(filter []string) (apimodels.GettableSilences, error) {
	panic("not implemented")
}

func (f FakeAlertmanager) GetAlerts(active, silenced, inhibited bool, filter []string, receiver string) (apimodels.GettableAlerts, error) {
	panic("not implemented")
}
func (f FakeAlertmanager) GetAlertGroups(active, silenced, inhibited bool, filter []string, receiver string) (apimodels.AlertGroups, error) {
	panic("not implemented")
}

func (f FakeAlertmanager) TestReceivers(ctx context.Context, c apimodels.TestReceiversConfigBodyParams) (*notifier.TestReceiversResult, error) {
	panic("not implemented")
}
