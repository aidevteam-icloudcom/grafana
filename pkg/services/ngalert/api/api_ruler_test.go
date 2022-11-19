package api

import (
	"context"
	"encoding/json"
	"fmt"
	"math/rand"
	"net/http"
	"net/url"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"

	"github.com/grafana/grafana/pkg/infra/log"
	models2 "github.com/grafana/grafana/pkg/models"
	"github.com/grafana/grafana/pkg/services/accesscontrol"
	acMock "github.com/grafana/grafana/pkg/services/accesscontrol/mock"
	"github.com/grafana/grafana/pkg/services/dashboards"
	"github.com/grafana/grafana/pkg/services/datasources"
	"github.com/grafana/grafana/pkg/services/folder"
	apimodels "github.com/grafana/grafana/pkg/services/ngalert/api/tooling/definitions"
	"github.com/grafana/grafana/pkg/services/ngalert/models"
	"github.com/grafana/grafana/pkg/services/ngalert/provisioning"
	"github.com/grafana/grafana/pkg/services/ngalert/schedule"
	"github.com/grafana/grafana/pkg/services/ngalert/store"
	"github.com/grafana/grafana/pkg/services/ngalert/tests/fakes"
	"github.com/grafana/grafana/pkg/services/org"
	"github.com/grafana/grafana/pkg/services/user"
	"github.com/grafana/grafana/pkg/util"
	"github.com/grafana/grafana/pkg/web"
)

func TestRouteDeleteAlertRules(t *testing.T) {
	getRecordedCommand := func(ruleStore *fakes.RuleStore) []fakes.GenericRecordedQuery {
		results := ruleStore.GetRecordedCommands(func(cmd interface{}) (interface{}, bool) {
			c, ok := cmd.(fakes.GenericRecordedQuery)
			if !ok || c.Name != "DeleteAlertRulesByUID" {
				return nil, false
			}
			return c, ok
		})
		var result []fakes.GenericRecordedQuery
		for _, cmd := range results {
			result = append(result, cmd.(fakes.GenericRecordedQuery))
		}
		return result
	}

	assertRulesDeleted := func(t *testing.T, expectedRules []*models.AlertRule, ruleStore *fakes.RuleStore, scheduler *schedule.FakeScheduleService) {
		deleteCommands := getRecordedCommand(ruleStore)
		require.Len(t, deleteCommands, 1)
		cmd := deleteCommands[0]
		actualUIDs := cmd.Params[1].([]string)
		require.Len(t, actualUIDs, len(expectedRules))
		for _, rule := range expectedRules {
			require.Containsf(t, actualUIDs, rule.UID, "Rule %s was expected to be deleted but it wasn't", rule.UID)
		}

		notDeletedRules := make(map[models.AlertRuleKey]struct{}, len(expectedRules))
		for _, rule := range expectedRules {
			notDeletedRules[rule.GetKey()] = struct{}{}
		}
		for _, call := range scheduler.Calls {
			require.Equal(t, "DeleteAlertRule", call.Method)
			keys, ok := call.Arguments.Get(0).([]models.AlertRuleKey)
			require.Truef(t, ok, "Expected AlertRuleKey but got something else")
			for _, key := range keys {
				delete(notDeletedRules, key)
			}
		}
		require.Emptyf(t, notDeletedRules, "Not all rules were deleted")
	}

	orgID := rand.Int63()
	folder := randFolder()

	initFakeRuleStore := func(t *testing.T) *fakes.RuleStore {
		ruleStore := fakes.NewRuleStore(t)
		ruleStore.Folders[orgID] = append(ruleStore.Folders[orgID], folder)
		// add random data
		ruleStore.PutRule(context.Background(), models.GenerateAlertRulesSmallNonEmpty(models.AlertRuleGen(withOrgID(orgID)))...)
		return ruleStore
	}

	t.Run("when fine-grained access is disabled", func(t *testing.T) {
		ac := acMock.New().WithDisabled()
		t.Run("viewer should not be authorized", func(t *testing.T) {
			ruleStore := initFakeRuleStore(t)
			ruleStore.PutRule(context.Background(), models.GenerateAlertRulesSmallNonEmpty(models.AlertRuleGen(withOrgID(orgID), withNamespace(folder)))...)

			scheduler := &schedule.FakeScheduleService{}
			scheduler.On("DeleteAlertRule", mock.Anything)

			request := createRequestContext(orgID, org.RoleViewer, nil)
			response := createService(ac, ruleStore, scheduler).RouteDeleteAlertRules(request, folder.Title, "")
			require.Equalf(t, 401, response.Status(), "Expected 401 but got %d: %v", response.Status(), string(response.Body()))

			scheduler.AssertNotCalled(t, "DeleteAlertRule")
			require.Empty(t, getRecordedCommand(ruleStore))
		})
		t.Run("editor should be able to delete all non-provisioned rules in folder", func(t *testing.T) {
			ruleStore := initFakeRuleStore(t)
			rulesInFolder := models.GenerateAlertRulesSmallNonEmpty(models.AlertRuleGen(withOrgID(orgID), withNamespace(folder)))
			ruleStore.PutRule(context.Background(), rulesInFolder...)

			scheduler := &schedule.FakeScheduleService{}
			scheduler.On("DeleteAlertRule", mock.Anything)

			request := createRequestContext(orgID, org.RoleEditor, nil)
			response := createService(ac, ruleStore, scheduler).RouteDeleteAlertRules(request, folder.Title, "")

			require.Equalf(t, 202, response.Status(), "Expected 202 but got %d: %v", response.Status(), string(response.Body()))
			assertRulesDeleted(t, rulesInFolder, ruleStore, scheduler)
		})
		t.Run("editor should be able to delete rules group if it is not provisioned", func(t *testing.T) {
			groupName := util.GenerateShortUID()
			rulesInFolderInGroup := models.GenerateAlertRulesSmallNonEmpty(models.AlertRuleGen(withOrgID(orgID), withNamespace(folder), withGroup(groupName)))

			ruleStore := initFakeRuleStore(t)
			ruleStore.PutRule(context.Background(), rulesInFolderInGroup...)
			// rules in different groups but in the same namespace
			ruleStore.PutRule(context.Background(), models.GenerateAlertRulesSmallNonEmpty(models.AlertRuleGen(withOrgID(orgID), withNamespace(folder)))...)
			// rules in the same group but different folder
			ruleStore.PutRule(context.Background(), models.GenerateAlertRulesSmallNonEmpty(models.AlertRuleGen(withOrgID(orgID), withGroup(groupName)))...)

			scheduler := &schedule.FakeScheduleService{}
			scheduler.On("DeleteAlertRule", mock.Anything).Return()

			request := createRequestContext(orgID, org.RoleEditor, nil)
			response := createService(ac, ruleStore, scheduler).RouteDeleteAlertRules(request, folder.Title, groupName)

			require.Equalf(t, 202, response.Status(), "Expected 202 but got %d: %v", response.Status(), string(response.Body()))
			assertRulesDeleted(t, rulesInFolderInGroup, ruleStore, scheduler)
		})
		t.Run("should return 202 if folder is empty", func(t *testing.T) {
			ruleStore := initFakeRuleStore(t)

			scheduler := &schedule.FakeScheduleService{}
			scheduler.On("DeleteAlertRule", mock.Anything)

			requestCtx := createRequestContext(orgID, org.RoleEditor, nil)
			response := createService(ac, ruleStore, scheduler).RouteDeleteAlertRules(requestCtx, folder.Title, "")

			require.Equalf(t, 202, response.Status(), "Expected 202 but got %d: %v", response.Status(), string(response.Body()))
			scheduler.AssertNotCalled(t, "DeleteAlertRule")
			require.Empty(t, getRecordedCommand(ruleStore))
		})
	})
	t.Run("when fine-grained access is enabled", func(t *testing.T) {
		requestCtx := createRequestContext(orgID, "None", nil)

		t.Run("and group argument is empty", func(t *testing.T) {
			t.Run("return 401 if user is not authorized to access any group in the folder", func(t *testing.T) {
				ruleStore := initFakeRuleStore(t)
				ruleStore.PutRule(context.Background(), models.GenerateAlertRulesSmallNonEmpty(models.AlertRuleGen(withOrgID(orgID), withNamespace(folder)))...)

				scheduler := &schedule.FakeScheduleService{}
				scheduler.On("DeleteAlertRule", mock.Anything).Panic("should not be called")

				ac := acMock.New()
				request := createRequestContext(orgID, "None", nil)

				response := createService(ac, ruleStore, scheduler).RouteDeleteAlertRules(request, folder.Title, "")
				require.Equalf(t, 401, response.Status(), "Expected 401 but got %d: %v", response.Status(), string(response.Body()))

				scheduler.AssertNotCalled(t, "DeleteAlertRule")
				require.Empty(t, getRecordedCommand(ruleStore))
			})
			t.Run("delete only non-provisioned groups that user is authorized", func(t *testing.T) {
				ruleStore := initFakeRuleStore(t)
				provisioningStore := provisioning.NewFakeProvisioningStore()

				scheduler := &schedule.FakeScheduleService{}
				scheduler.On("DeleteAlertRule", mock.Anything)

				authorizedRulesInFolder := models.GenerateAlertRulesSmallNonEmpty(models.AlertRuleGen(withOrgID(orgID), withNamespace(folder), withGroup("authz_"+util.GenerateShortUID())))

				provisionedRulesInFolder := models.GenerateAlertRulesSmallNonEmpty(models.AlertRuleGen(withOrgID(orgID), withNamespace(folder), withGroup("provisioned_"+util.GenerateShortUID())))
				err := provisioningStore.SetProvenance(context.Background(), provisionedRulesInFolder[0], orgID, models.ProvenanceAPI)
				require.NoError(t, err)

				ruleStore.PutRule(context.Background(), authorizedRulesInFolder...)
				ruleStore.PutRule(context.Background(), provisionedRulesInFolder...)
				// more rules in the same namespace but user does not have access to them
				ruleStore.PutRule(context.Background(), models.GenerateAlertRulesSmallNonEmpty(models.AlertRuleGen(withOrgID(orgID), withNamespace(folder), withGroup("unauthz"+util.GenerateShortUID())))...)

				ac := acMock.New().WithPermissions(createPermissionsForRules(append(authorizedRulesInFolder, provisionedRulesInFolder...)))

				response := createServiceWithProvenanceStore(ac, ruleStore, scheduler, provisioningStore).RouteDeleteAlertRules(requestCtx, folder.Title, "")

				require.Equalf(t, 202, response.Status(), "Expected 202 but got %d: %v", response.Status(), string(response.Body()))
				assertRulesDeleted(t, authorizedRulesInFolder, ruleStore, scheduler)
			})
			t.Run("return 400 if all rules user can access are provisioned", func(t *testing.T) {
				ruleStore := initFakeRuleStore(t)
				provisioningStore := provisioning.NewFakeProvisioningStore()

				provisionedRulesInFolder := models.GenerateAlertRulesSmallNonEmpty(models.AlertRuleGen(withOrgID(orgID), withNamespace(folder), withGroup(util.GenerateShortUID())))
				err := provisioningStore.SetProvenance(context.Background(), provisionedRulesInFolder[0], orgID, models.ProvenanceAPI)
				require.NoError(t, err)

				ruleStore.PutRule(context.Background(), provisionedRulesInFolder...)
				// more rules in the same namespace but user does not have access to them
				ruleStore.PutRule(context.Background(), models.GenerateAlertRulesSmallNonEmpty(models.AlertRuleGen(withOrgID(orgID), withNamespace(folder), withGroup(util.GenerateShortUID())))...)

				scheduler := &schedule.FakeScheduleService{}
				scheduler.On("DeleteAlertRule", mock.Anything)

				ac := acMock.New().WithPermissions(createPermissionsForRules(provisionedRulesInFolder))

				response := createServiceWithProvenanceStore(ac, ruleStore, scheduler, provisioningStore).RouteDeleteAlertRules(requestCtx, folder.Title, "")

				require.Equalf(t, 400, response.Status(), "Expected 400 but got %d: %v", response.Status(), string(response.Body()))
				scheduler.AssertNotCalled(t, "DeleteAlertRule")
				require.Empty(t, getRecordedCommand(ruleStore))
			})
		})
		t.Run("and group argument is not empty", func(t *testing.T) {
			groupName := util.GenerateShortUID()
			t.Run("return 401 if user is not authorized to access the group", func(t *testing.T) {
				ruleStore := initFakeRuleStore(t)

				authorizedRulesInGroup := models.GenerateAlertRulesSmallNonEmpty(models.AlertRuleGen(withOrgID(orgID), withNamespace(folder), withGroup(groupName)))
				ruleStore.PutRule(context.Background(), authorizedRulesInGroup...)
				// more rules in the same group but user is not authorized to access them
				ruleStore.PutRule(context.Background(), models.GenerateAlertRulesSmallNonEmpty(models.AlertRuleGen(withOrgID(orgID), withNamespace(folder), withGroup(groupName)))...)

				scheduler := &schedule.FakeScheduleService{}
				scheduler.On("DeleteAlertRule", mock.Anything)

				ac := acMock.New().WithPermissions(createPermissionsForRules(authorizedRulesInGroup))

				response := createService(ac, ruleStore, scheduler).RouteDeleteAlertRules(requestCtx, folder.Title, groupName)

				require.Equalf(t, 401, response.Status(), "Expected 401 but got %d: %v", response.Status(), string(response.Body()))
				scheduler.AssertNotCalled(t, "DeleteAlertRule", mock.Anything)
				deleteCommands := getRecordedCommand(ruleStore)
				require.Empty(t, deleteCommands)
			})
			t.Run("return 400 if group is provisioned", func(t *testing.T) {
				ruleStore := initFakeRuleStore(t)
				provisioningStore := provisioning.NewFakeProvisioningStore()

				provisionedRulesInFolder := models.GenerateAlertRulesSmallNonEmpty(models.AlertRuleGen(withOrgID(orgID), withNamespace(folder), withGroup(groupName)))
				err := provisioningStore.SetProvenance(context.Background(), provisionedRulesInFolder[0], orgID, models.ProvenanceAPI)
				require.NoError(t, err)

				ruleStore.PutRule(context.Background(), provisionedRulesInFolder...)

				scheduler := &schedule.FakeScheduleService{}
				scheduler.On("DeleteAlertRule", mock.Anything)

				ac := acMock.New().WithPermissions(createPermissionsForRules(provisionedRulesInFolder))

				response := createServiceWithProvenanceStore(ac, ruleStore, scheduler, provisioningStore).RouteDeleteAlertRules(requestCtx, folder.Title, groupName)

				require.Equalf(t, 400, response.Status(), "Expected 400 but got %d: %v", response.Status(), string(response.Body()))
				scheduler.AssertNotCalled(t, "DeleteAlertRule", mock.Anything)
				deleteCommands := getRecordedCommand(ruleStore)
				require.Empty(t, deleteCommands)
			})
		})
	})
}

func TestRouteDeleteAlertRule(t *testing.T) {
	orgID := rand.Int63()
	folder := randFolder()

	groupKey := models.AlertRuleGroupKey{
		OrgID:        orgID,
		NamespaceUID: folder.UID,
		RuleGroup:    util.GenerateShortUID(),
	}

	getRecordedCommand := func(ruleStore *fakes.RuleStore, command string) []fakes.GenericRecordedQuery {
		results := ruleStore.GetRecordedCommands(func(cmd interface{}) (interface{}, bool) {
			c, ok := cmd.(fakes.GenericRecordedQuery)
			if !ok || c.Name != command {
				return nil, false
			}
			return c, ok
		})
		var result []fakes.GenericRecordedQuery
		for _, cmd := range results {
			result = append(result, cmd.(fakes.GenericRecordedQuery))
		}
		return result
	}

	initFakeRuleStore := func(t *testing.T) *fakes.RuleStore {
		ruleStore := fakes.NewRuleStore(t)
		ruleStore.Folders[orgID] = append(ruleStore.Folders[orgID], folder)
		// add random data
		ruleStore.PutRule(context.Background(), models.GenerateAlertRulesSmallNonEmpty(models.AlertRuleGen(withOrgID(orgID)))...)
		return ruleStore
	}
	t.Run("should return 404 when rule does not exist", func(t *testing.T) {
		ruleStore := initFakeRuleStore(t)
		rulesInFolder := models.GenerateAlertRulesSmallNonEmpty(models.AlertRuleGen(withGroupKey(groupKey)))
		ruleStore.PutRule(context.Background(), rulesInFolder...)

		scheduler := &schedule.FakeScheduleService{}
		scheduler.On("DeleteAlertRule", mock.Anything)

		request := createRequestContext(orgID, "", nil)
		ac := &fakeAccessControl{
			ExpectedDisabled: false,
			ExpectedEvaluate: true,
		}
		toDelete := util.GenerateShortUID()
		for {
			q := &models.GetAlertRuleByUIDQuery{UID: toDelete}
			_ = ruleStore.GetAlertRuleByUID(request.Req.Context(), q)
			if q.Result == nil {
				break
			}
			toDelete = util.GenerateShortUID()
		}

		response := createService(ac, ruleStore, scheduler).RouteDeleteAlertRule(request, toDelete)
		require.Equalf(t, 404, response.Status(), "Expected 404 but got %d: %v", response.Status(), string(response.Body()))

		scheduler.AssertNotCalled(t, "DeleteAlertRule")
		require.Empty(t, getRecordedCommand(ruleStore, "DeleteAlertRulesByUID"))
		require.Emptyf(t, ac.RecordedOps, "access control service was not expected to be called")
	})
	t.Run("should return 404 if user has no access to folder", func(t *testing.T) {
		ruleStore := initFakeRuleStore(t)
		rulesInFolder := models.GenerateAlertRulesSmallNonEmpty(models.AlertRuleGen(withGroupKey(groupKey)))
		ruleStore.PutRule(context.Background(), rulesInFolder...)

		ruleToDelete := rulesInFolder[rand.Intn(len(rulesInFolder))]

		scheduler := &schedule.FakeScheduleService{}
		scheduler.On("DeleteAlertRule", mock.Anything)

		request := createRequestContext(orgID, org.RoleViewer, nil)
		ac := &fakeAccessControl{
			ExpectedDisabled: false,
			ExpectedEvaluate: false,
		}

		response := createService(ac, ruleStore, scheduler).RouteDeleteAlertRule(request, ruleToDelete.UID)
		require.Equalf(t, 404, response.Status(), "Expected 404 but got %d: %v", response.Status(), string(response.Body()))

		scheduler.AssertNotCalled(t, "DeleteAlertRule")
		require.Empty(t, getRecordedCommand(ruleStore, "DeleteAlertRulesByUID"))
		require.NotEmptyf(t, ac.RecordedOps, "access control service was expected to be called")
		require.Equal(t,
			accesscontrol.EvalPermission(accesscontrol.ActionAlertingRuleDelete,
				dashboards.ScopeFoldersProvider.GetResourceScopeUID(ruleToDelete.NamespaceUID),
			),
			ac.RecordedOps[0])
	})

	t.Run("should return 401 if user has no access to the group's data sources", func(t *testing.T) {
		ruleStore := initFakeRuleStore(t)
		rulesInFolder := models.GenerateAlertRulesSmallNonEmpty(models.AlertRuleGen(withGroupKey(groupKey)))
		ruleStore.PutRule(context.Background(), rulesInFolder...)

		ruleToDelete := rulesInFolder[rand.Intn(len(rulesInFolder))]

		scheduler := &schedule.FakeScheduleService{}
		scheduler.On("DeleteAlertRule", mock.Anything)

		request := createRequestContext(orgID, org.RoleViewer, nil)

		ac := &fakeAccessControl{
			ExpectedDisabled: false,
			Hook: func(user *user.SignedInUser, evaluator accesscontrol.Evaluator) (bool, error) {
				return evaluator.Evaluate(
					map[string][]string{
						accesscontrol.ActionAlertingRuleDelete: {dashboards.ScopeFoldersProvider.GetResourceScopeUID(ruleToDelete.NamespaceUID)},
					},
				), nil
			},
		}

		response := createService(ac, ruleStore, scheduler).RouteDeleteAlertRule(request, ruleToDelete.UID)
		require.Equalf(t, 401, response.Status(), "Expected 401 but got %d: %v", response.Status(), string(response.Body()))

		scheduler.AssertNotCalled(t, "DeleteAlertRule")
		require.Empty(t, getRecordedCommand(ruleStore, "DeleteAlertRulesByUID"))
		require.NotEmptyf(t, ac.RecordedOps, "access control service was expected to be called")
	})

	t.Run("should delete rule from the group", func(t *testing.T) {
		ruleStore := initFakeRuleStore(t)

		rulesInFolder := models.GenerateAlertRules(5, models.AlertRuleGen(withGroupKey(groupKey), models.WithSequentialGroupIndex()))
		ruleStore.PutRule(context.Background(), rulesInFolder...)

		deletedIndex := 2
		ruleToDelete := rulesInFolder[deletedIndex] // take any rule except the last
		expectedIndices := make(map[string]int, len(rulesInFolder)-1)
		increment := 0
		for _, rule := range rulesInFolder {
			if rule == ruleToDelete {
				increment++
				continue
			}
			expectedIndices[rule.UID] = rule.RuleGroupIndex - increment
		}

		scheduler := &schedule.FakeScheduleService{}
		scheduler.On("DeleteAlertRule", mock.Anything)
		scheduler.On("UpdateAlertRule", mock.Anything, mock.Anything)

		request := createRequestContext(orgID, org.RoleViewer, nil)

		ac := &fakeAccessControl{
			ExpectedDisabled: false,
			ExpectedEvaluate: true,
		}

		response := createService(ac, ruleStore, scheduler).RouteDeleteAlertRule(request, ruleToDelete.UID)
		require.Equalf(t, 202, response.Status(), "Expected 202 but got %d: %v", response.Status(), string(response.Body()))

		scheduler.AssertCalled(t, "DeleteAlertRule", []models.AlertRuleKey{ruleToDelete.GetKey()})
		require.NotEmptyf(t, ac.RecordedOps, "access control service was expected to be called")

		cmds := getRecordedCommand(ruleStore, "DeleteAlertRulesByUID")
		require.NotEmptyf(t, cmds, "Expected to be a delete by UID operation")
		require.Equal(t, orgID, cmds[0].Params[0])
		require.Equal(t, []string{ruleToDelete.UID}, cmds[0].Params[1])
		t.Logf("Deleting index %d", deletedIndex)
		t.Run("and re-index remaining rules", func(t *testing.T) {
			var updateRules []models.UpdateRule
			for _, operation := range ruleStore.RecordedOps {
				var ok bool
				updateRules, ok = operation.([]models.UpdateRule)
				if ok {
					break
				}
			}
			require.NotEmptyf(t, updateRules, "Expected update command but got none")
			require.Len(t, updateRules, len(rulesInFolder)-1)
			for _, delta := range updateRules {
				idx, ok := expectedIndices[delta.New.UID]
				require.Truef(t, ok, "unknown rule in delta")
				require.Equal(t, idx, delta.New.RuleGroupIndex)
			}
		})
	})
}

func TestRouteGetNamespaceRulesConfig(t *testing.T) {
	t.Run("fine-grained access is enabled", func(t *testing.T) {
		t.Run("should return rules for which user has access to data source", func(t *testing.T) {
			orgID := rand.Int63()
			folder := randFolder()
			ruleStore := fakes.NewRuleStore(t)
			ruleStore.Folders[orgID] = append(ruleStore.Folders[orgID], folder)
			expectedRules := models.GenerateAlertRules(rand.Intn(4)+2, models.AlertRuleGen(withOrgID(orgID), withNamespace(folder)))
			ruleStore.PutRule(context.Background(), expectedRules...)
			ruleStore.PutRule(context.Background(), models.GenerateAlertRules(rand.Intn(4)+2, models.AlertRuleGen(withOrgID(orgID), withNamespace(folder)))...)
			ac := acMock.New().WithPermissions(createPermissionsForRules(expectedRules))

			req := createRequestContext(orgID, "", nil)
			response := createService(ac, ruleStore, nil).RouteGetNamespaceRulesConfig(req, folder.Title)

			require.Equal(t, http.StatusAccepted, response.Status())
			result := &apimodels.NamespaceConfigResponse{}
			require.NoError(t, json.Unmarshal(response.Body(), result))
			require.NotNil(t, result)
			for namespace, groups := range *result {
				require.Equal(t, folder.Title, namespace)
				for _, group := range groups {
				grouploop:
					for _, actualRule := range group.Rules {
						for i, expected := range expectedRules {
							if actualRule.GrafanaManagedAlert.UID == expected.UID {
								expectedRules = append(expectedRules[:i], expectedRules[i+1:]...)
								continue grouploop
							}
						}
						assert.Failf(t, "rule in a group was not found in expected", "rule %s group %s", actualRule.GrafanaManagedAlert.Title, group.Name)
					}
				}
			}
			assert.Emptyf(t, expectedRules, "not all expected rules were returned")
		})
	})
	t.Run("fine-grained access is disabled", func(t *testing.T) {
		t.Run("should return all rules from folder", func(t *testing.T) {
			orgID := rand.Int63()
			folder := randFolder()
			ruleStore := fakes.NewRuleStore(t)
			ruleStore.Folders[orgID] = append(ruleStore.Folders[orgID], folder)
			expectedRules := models.GenerateAlertRules(rand.Intn(4)+2, models.AlertRuleGen(withOrgID(orgID), withNamespace(folder)))
			ruleStore.PutRule(context.Background(), expectedRules...)
			ac := acMock.New().WithDisabled()

			req := createRequestContext(orgID, org.RoleViewer, nil)
			response := createService(ac, ruleStore, nil).RouteGetNamespaceRulesConfig(req, folder.Title)

			require.Equal(t, http.StatusAccepted, response.Status())
			result := &apimodels.NamespaceConfigResponse{}
			require.NoError(t, json.Unmarshal(response.Body(), result))
			require.NotNil(t, result)
			for namespace, groups := range *result {
				require.Equal(t, folder.Title, namespace)
				for _, group := range groups {
				grouploop:
					for _, actualRule := range group.Rules {
						for i, expected := range expectedRules {
							if actualRule.GrafanaManagedAlert.UID == expected.UID {
								expectedRules = append(expectedRules[:i], expectedRules[i+1:]...)
								continue grouploop
							}
						}
						assert.Failf(t, "rule in a group was not found in expected", "rule %s group %s", actualRule.GrafanaManagedAlert.Title, group.Name)
					}
				}
			}
			assert.Emptyf(t, expectedRules, "not all expected rules were returned")
		})
	})
	t.Run("should return the provenance of the alert rules", func(t *testing.T) {
		orgID := rand.Int63()
		folder := randFolder()
		ruleStore := fakes.NewRuleStore(t)
		ruleStore.Folders[orgID] = append(ruleStore.Folders[orgID], folder)
		expectedRules := models.GenerateAlertRules(rand.Intn(4)+2, models.AlertRuleGen(withOrgID(orgID), withNamespace(folder)))
		ruleStore.PutRule(context.Background(), expectedRules...)
		ac := acMock.New().WithDisabled()

		svc := createService(ac, ruleStore, nil)

		// add provenance to the first generated rule
		rule := &models.AlertRule{
			UID: expectedRules[0].UID,
		}
		err := svc.provenanceStore.SetProvenance(context.Background(), rule, orgID, models.ProvenanceAPI)
		require.NoError(t, err)

		req := createRequestContext(orgID, org.RoleViewer, nil)
		response := svc.RouteGetNamespaceRulesConfig(req, folder.Title)

		require.Equal(t, http.StatusAccepted, response.Status())
		result := &apimodels.NamespaceConfigResponse{}
		require.NoError(t, json.Unmarshal(response.Body(), result))
		require.NotNil(t, result)
		found := false
		for namespace, groups := range *result {
			require.Equal(t, folder.Title, namespace)
			for _, group := range groups {
				for _, actualRule := range group.Rules {
					if actualRule.GrafanaManagedAlert.UID == expectedRules[0].UID {
						require.Equal(t, models.ProvenanceAPI, actualRule.GrafanaManagedAlert.Provenance)
						found = true
					} else {
						require.Equal(t, models.ProvenanceNone, actualRule.GrafanaManagedAlert.Provenance)
					}
				}
			}
		}
		require.True(t, found)
	})
	t.Run("should enforce order of rules in the group", func(t *testing.T) {
		orgID := rand.Int63()
		folder := randFolder()
		ruleStore := fakes.NewRuleStore(t)
		ruleStore.Folders[orgID] = append(ruleStore.Folders[orgID], folder)
		groupKey := models.GenerateGroupKey(orgID)
		groupKey.NamespaceUID = folder.UID

		expectedRules := models.GenerateAlertRules(rand.Intn(5)+5, models.AlertRuleGen(withGroupKey(groupKey), models.WithUniqueGroupIndex()))
		ruleStore.PutRule(context.Background(), expectedRules...)
		ac := acMock.New().WithDisabled()

		response := createService(ac, ruleStore, nil).RouteGetNamespaceRulesConfig(createRequestContext(orgID, org.RoleViewer, nil), folder.Title)

		require.Equal(t, http.StatusAccepted, response.Status())
		result := &apimodels.NamespaceConfigResponse{}
		require.NoError(t, json.Unmarshal(response.Body(), result))
		require.NotNil(t, result)

		models.RulesGroup(expectedRules).SortByGroupIndex()

		require.Contains(t, *result, folder.Title)
		groups := (*result)[folder.Title]
		require.Len(t, groups, 1)
		group := groups[0]
		require.Equal(t, groupKey.RuleGroup, group.Name)
		for i, actual := range groups[0].Rules {
			expected := expectedRules[i]
			if actual.GrafanaManagedAlert.UID != expected.UID {
				var actualUIDs []string
				var expectedUIDs []string
				for _, rule := range group.Rules {
					actualUIDs = append(actualUIDs, rule.GrafanaManagedAlert.UID)
				}
				for _, rule := range expectedRules {
					expectedUIDs = append(expectedUIDs, rule.UID)
				}
				require.Fail(t, fmt.Sprintf("rules are not sorted by group index. Expected: %v. Actual: %v", expectedUIDs, actualUIDs))
			}
		}
	})
}

func TestRouteGetRulesConfig(t *testing.T) {
	t.Run("fine-grained access is enabled", func(t *testing.T) {
		t.Run("should check access to data source", func(t *testing.T) {
			orgID := rand.Int63()
			ruleStore := fakes.NewRuleStore(t)
			folder1 := randFolder()
			folder2 := randFolder()
			ruleStore.Folders[orgID] = []*folder.Folder{folder1, folder2}

			group1Key := models.GenerateGroupKey(orgID)
			group1Key.NamespaceUID = folder1.UID
			group2Key := models.GenerateGroupKey(orgID)
			group2Key.NamespaceUID = folder2.UID

			group1 := models.GenerateAlertRules(rand.Intn(4)+2, models.AlertRuleGen(withGroupKey(group1Key)))
			group2 := models.GenerateAlertRules(rand.Intn(4)+2, models.AlertRuleGen(withGroupKey(group2Key)))
			ruleStore.PutRule(context.Background(), append(group1, group2...)...)

			request := createRequestContext(orgID, "", nil)
			t.Run("and do not return group if user does not have access to one of rules", func(t *testing.T) {
				ac := acMock.New().WithPermissions(createPermissionsForRules(append(group1, group2[1:]...)))
				response := createService(ac, ruleStore, nil).RouteGetRulesConfig(request)
				require.Equal(t, http.StatusOK, response.Status())

				result := &apimodels.NamespaceConfigResponse{}
				require.NoError(t, json.Unmarshal(response.Body(), result))
				require.NotNil(t, result)

				require.Contains(t, *result, folder1.Title)
				require.NotContains(t, *result, folder2.Title)

				groups := (*result)[folder1.Title]
				require.Len(t, groups, 1)
				require.Equal(t, group1Key.RuleGroup, groups[0].Name)
				require.Len(t, groups[0].Rules, len(group1))
			})
		})
	})

	t.Run("should return rules in group sorted by group index", func(t *testing.T) {
		orgID := rand.Int63()
		folder := randFolder()
		ruleStore := fakes.NewRuleStore(t)
		ruleStore.Folders[orgID] = append(ruleStore.Folders[orgID], folder)
		groupKey := models.GenerateGroupKey(orgID)
		groupKey.NamespaceUID = folder.UID

		expectedRules := models.GenerateAlertRules(rand.Intn(5)+5, models.AlertRuleGen(withGroupKey(groupKey), models.WithUniqueGroupIndex()))
		ruleStore.PutRule(context.Background(), expectedRules...)
		ac := acMock.New().WithDisabled()

		response := createService(ac, ruleStore, nil).RouteGetRulesConfig(createRequestContext(orgID, org.RoleViewer, nil))

		require.Equal(t, http.StatusOK, response.Status())
		result := &apimodels.NamespaceConfigResponse{}
		require.NoError(t, json.Unmarshal(response.Body(), result))
		require.NotNil(t, result)

		models.RulesGroup(expectedRules).SortByGroupIndex()

		require.Contains(t, *result, folder.Title)
		groups := (*result)[folder.Title]
		require.Len(t, groups, 1)
		group := groups[0]
		require.Equal(t, groupKey.RuleGroup, group.Name)
		for i, actual := range groups[0].Rules {
			expected := expectedRules[i]
			if actual.GrafanaManagedAlert.UID != expected.UID {
				var actualUIDs []string
				var expectedUIDs []string
				for _, rule := range group.Rules {
					actualUIDs = append(actualUIDs, rule.GrafanaManagedAlert.UID)
				}
				for _, rule := range expectedRules {
					expectedUIDs = append(expectedUIDs, rule.UID)
				}
				require.Fail(t, fmt.Sprintf("rules are not sorted by group index. Expected: %v. Actual: %v", expectedUIDs, actualUIDs))
			}
		}
	})
}

func TestRouteGetRulesGroupConfig(t *testing.T) {
	t.Run("fine-grained access is enabled", func(t *testing.T) {
		t.Run("should check access to data source", func(t *testing.T) {
			orgID := rand.Int63()
			folder := randFolder()
			ruleStore := fakes.NewRuleStore(t)
			ruleStore.Folders[orgID] = append(ruleStore.Folders[orgID], folder)
			groupKey := models.GenerateGroupKey(orgID)
			groupKey.NamespaceUID = folder.UID

			expectedRules := models.GenerateAlertRules(rand.Intn(4)+2, models.AlertRuleGen(withGroupKey(groupKey)))
			ruleStore.PutRule(context.Background(), expectedRules...)

			request := createRequestContext(orgID, "", map[string]string{
				":Namespace": folder.Title,
				":Groupname": groupKey.RuleGroup,
			})

			t.Run("and return 401 if user does not have access one of rules", func(t *testing.T) {
				ac := acMock.New().WithPermissions(createPermissionsForRules(expectedRules[1:]))
				response := createService(ac, ruleStore, nil).RouteGetRulesGroupConfig(request, folder.Title, groupKey.RuleGroup)
				require.Equal(t, http.StatusUnauthorized, response.Status())
			})

			t.Run("and return rules if user has access to all of them", func(t *testing.T) {
				ac := acMock.New().WithPermissions(createPermissionsForRules(expectedRules))
				response := createService(ac, ruleStore, nil).RouteGetRulesGroupConfig(request, folder.Title, groupKey.RuleGroup)

				require.Equal(t, http.StatusAccepted, response.Status())
				result := &apimodels.RuleGroupConfigResponse{}
				require.NoError(t, json.Unmarshal(response.Body(), result))
				require.NotNil(t, result)
				require.Len(t, result.Rules, len(expectedRules))
			})
		})
	})

	t.Run("should return rules in group sorted by group index", func(t *testing.T) {
		orgID := rand.Int63()
		folder := randFolder()
		ruleStore := fakes.NewRuleStore(t)
		ruleStore.Folders[orgID] = append(ruleStore.Folders[orgID], folder)
		groupKey := models.GenerateGroupKey(orgID)
		groupKey.NamespaceUID = folder.UID

		expectedRules := models.GenerateAlertRules(rand.Intn(5)+5, models.AlertRuleGen(withGroupKey(groupKey), models.WithUniqueGroupIndex()))
		ruleStore.PutRule(context.Background(), expectedRules...)
		ac := acMock.New().WithDisabled()

		response := createService(ac, ruleStore, nil).RouteGetRulesGroupConfig(createRequestContext(orgID, org.RoleViewer, nil), folder.Title, groupKey.RuleGroup)

		require.Equal(t, http.StatusAccepted, response.Status())
		result := &apimodels.RuleGroupConfigResponse{}
		require.NoError(t, json.Unmarshal(response.Body(), result))
		require.NotNil(t, result)

		models.RulesGroup(expectedRules).SortByGroupIndex()

		for i, actual := range result.Rules {
			expected := expectedRules[i]
			if actual.GrafanaManagedAlert.UID != expected.UID {
				var actualUIDs []string
				var expectedUIDs []string
				for _, rule := range result.Rules {
					actualUIDs = append(actualUIDs, rule.GrafanaManagedAlert.UID)
				}
				for _, rule := range expectedRules {
					expectedUIDs = append(expectedUIDs, rule.UID)
				}
				require.Fail(t, fmt.Sprintf("rules are not sorted by group index. Expected: %v. Actual: %v", expectedUIDs, actualUIDs))
			}
		}
	})
}

func TestVerifyProvisionedRulesNotAffected(t *testing.T) {
	orgID := rand.Int63()
	group := models.GenerateGroupKey(orgID)
	affectedGroups := make(map[models.AlertRuleGroupKey]models.RulesGroup)
	var allRules []*models.AlertRule
	{
		rules := models.GenerateAlertRules(rand.Intn(3)+1, models.AlertRuleGen(withGroupKey(group)))
		allRules = append(allRules, rules...)
		affectedGroups[group] = rules
		for i := 0; i < rand.Intn(3)+1; i++ {
			g := models.GenerateGroupKey(orgID)
			rules := models.GenerateAlertRules(rand.Intn(3)+1, models.AlertRuleGen(withGroupKey(g)))
			allRules = append(allRules, rules...)
			affectedGroups[g] = rules
		}
	}
	ch := &store.GroupDelta{
		GroupKey:       group,
		AffectedGroups: affectedGroups,
	}

	t.Run("should return error if at least one rule in affected groups is provisioned", func(t *testing.T) {
		rand.Shuffle(len(allRules), func(i, j int) {
			allRules[j], allRules[i] = allRules[i], allRules[j]
		})
		storeResult := make(map[string]models.Provenance, len(allRules))
		storeResult[allRules[0].UID] = models.ProvenanceAPI
		storeResult[allRules[1].UID] = models.ProvenanceFile

		provenanceStore := &provisioning.MockProvisioningStore{}
		provenanceStore.EXPECT().GetProvenances(mock.Anything, orgID, "alertRule").Return(storeResult, nil)

		result := verifyProvisionedRulesNotAffected(context.Background(), provenanceStore, orgID, ch)
		require.Error(t, result)
		require.ErrorIs(t, result, errProvisionedResource)
		assert.Contains(t, result.Error(), allRules[0].GetGroupKey().String())
		assert.Contains(t, result.Error(), allRules[1].GetGroupKey().String())
	})

	t.Run("should return nil if all have ProvenanceNone", func(t *testing.T) {
		storeResult := make(map[string]models.Provenance, len(allRules))
		for _, rule := range allRules {
			storeResult[rule.UID] = models.ProvenanceNone
		}

		provenanceStore := &provisioning.MockProvisioningStore{}
		provenanceStore.EXPECT().GetProvenances(mock.Anything, orgID, "alertRule").Return(storeResult, nil)

		result := verifyProvisionedRulesNotAffected(context.Background(), provenanceStore, orgID, ch)
		require.NoError(t, result)
	})

	t.Run("should return nil if no alerts have provisioning status", func(t *testing.T) {
		provenanceStore := &provisioning.MockProvisioningStore{}
		provenanceStore.EXPECT().GetProvenances(mock.Anything, orgID, "alertRule").Return(make(map[string]models.Provenance, len(allRules)), nil)

		result := verifyProvisionedRulesNotAffected(context.Background(), provenanceStore, orgID, ch)
		require.NoError(t, result)
	})
}

func createServiceWithProvenanceStore(ac *acMock.Mock, store *fakes.RuleStore, scheduler schedule.ScheduleService, provenanceStore provisioning.ProvisioningStore) *RulerSrv {
	svc := createService(ac, store, scheduler)
	svc.provenanceStore = provenanceStore
	return svc
}

func createService(ac accesscontrol.AccessControl, store *fakes.RuleStore, scheduler schedule.ScheduleService) *RulerSrv {
	return &RulerSrv{
		xactManager:     store,
		store:           store,
		QuotaService:    nil,
		provenanceStore: provisioning.NewFakeProvisioningStore(),
		scheduleService: scheduler,
		log:             log.New("test"),
		cfg:             nil,
		ac:              ac,
	}
}

func createRequestContext(orgID int64, role org.RoleType, params map[string]string) *models2.ReqContext {
	uri, _ := url.Parse("http://localhost")
	ctx := web.Context{Req: &http.Request{
		URL: uri,
	}}
	if params != nil {
		ctx.Req = web.SetURLParams(ctx.Req, params)
	}

	return &models2.ReqContext{
		IsSignedIn: true,
		SignedInUser: &user.SignedInUser{
			OrgRole: role,
			OrgID:   orgID,
		},
		Context: &ctx,
	}
}

func createPermissionsForRules(rules []*models.AlertRule) []accesscontrol.Permission {
	var permissions []accesscontrol.Permission
	for _, rule := range rules {
		for _, query := range rule.Data {
			permissions = append(permissions, accesscontrol.Permission{
				Action: datasources.ActionQuery, Scope: datasources.ScopeProvider.GetResourceScopeUID(query.DatasourceUID),
			})
		}
	}
	return permissions
}

func withOrgID(orgId int64) func(rule *models.AlertRule) {
	return func(rule *models.AlertRule) {
		rule.OrgID = orgId
	}
}

func withGroup(groupName string) func(rule *models.AlertRule) {
	return func(rule *models.AlertRule) {
		rule.RuleGroup = groupName
	}
}

func withNamespace(namespace *folder.Folder) func(rule *models.AlertRule) {
	return func(rule *models.AlertRule) {
		rule.NamespaceUID = namespace.UID
	}
}

func withGroupKey(groupKey models.AlertRuleGroupKey) func(rule *models.AlertRule) {
	return func(rule *models.AlertRule) {
		rule.RuleGroup = groupKey.RuleGroup
		rule.OrgID = groupKey.OrgID
		rule.NamespaceUID = groupKey.NamespaceUID
	}
}

var _ accesscontrol.AccessControl = new(fakeAccessControl)

type fakeAccessControl struct {
	ExpectedErr      error
	ExpectedDisabled bool
	ExpectedEvaluate bool
	RecordedOps      []accesscontrol.Evaluator
	Hook             func(user *user.SignedInUser, evaluator accesscontrol.Evaluator) (bool, error)
}

func (f *fakeAccessControl) Evaluate(ctx context.Context, user *user.SignedInUser, evaluator accesscontrol.Evaluator) (bool, error) {
	f.RecordedOps = append(f.RecordedOps, evaluator)
	if f.Hook != nil {
		return f.Hook(user, evaluator)
	}
	return f.ExpectedEvaluate, f.ExpectedErr
}

func (f *fakeAccessControl) RegisterScopeAttributeResolver(prefix string, resolver accesscontrol.ScopeAttributeResolver) {
}

func (f fakeAccessControl) IsDisabled() bool {
	return f.ExpectedDisabled
}
