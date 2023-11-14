package loki

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"math/rand"
	"net/url"
	"strconv"
	"sync"
	"testing"
	"time"

	"github.com/grafana/grafana/pkg/components/simplejson"
	"github.com/grafana/grafana/pkg/infra/db"
	"github.com/grafana/grafana/pkg/infra/log"
	"github.com/grafana/grafana/pkg/services/annotations"
	annotation_ac "github.com/grafana/grafana/pkg/services/annotations/accesscontrol"
	"github.com/grafana/grafana/pkg/services/annotations/testutil"
	"github.com/grafana/grafana/pkg/services/dashboards"
	"github.com/grafana/grafana/pkg/services/featuremgmt"
	"github.com/grafana/grafana/pkg/services/ngalert/eval"
	"github.com/grafana/grafana/pkg/services/ngalert/metrics"
	ngmodels "github.com/grafana/grafana/pkg/services/ngalert/models"
	"github.com/grafana/grafana/pkg/services/ngalert/state"
	"github.com/grafana/grafana/pkg/services/ngalert/state/historian"
	historymodel "github.com/grafana/grafana/pkg/services/ngalert/state/historian/model"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/weaveworks/common/http/client"

	"github.com/stretchr/testify/require"
)

func TestIntegrationAlertStateHistoryStore(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping integration test")
	}

	t.Run("Testing Loki state history read", func(t *testing.T) {
		sql := db.InitTestDB(t)

		dashboard1 := testutil.CreateDashboard(t, sql, featuremgmt.WithFeatures(), dashboards.SaveDashboardCommand{
			UserID: 1,
			OrgID:  1,
			Dashboard: simplejson.NewFromAny(map[string]any{
				"title": "Dashboard 1",
			}),
		})

		dashboard2 := testutil.CreateDashboard(t, sql, featuremgmt.WithFeatures(), dashboards.SaveDashboardCommand{
			UserID: 1,
			OrgID:  1,
			Dashboard: simplejson.NewFromAny(map[string]any{
				"title": "Dashboard 2",
			}),
		})

		knownUIDs := &sync.Map{}

		dashAlert1 := createAlertRuleWithDashboard(
			t,
			sql,
			knownUIDs,
			"Test Rule 1",
			dashboard1.UID,
		)

		dashAlert2 := createAlertRuleWithDashboard(
			t,
			sql,
			knownUIDs,
			"Test Rule 2",
			dashboard1.UID,
		)

		dashAlert3 := createAlertRuleWithDashboard(
			t,
			sql,
			knownUIDs,
			"Test Rule 3",
			dashboard2.UID,
		)

		orgAlert1 := createAlertRule(
			t,
			sql,
			knownUIDs,
			"Test Rule 4",
		)
		orgAlert1.DashboardUID = nil

		start := time.Now()
		numTransitions := 10
		transitions := genStateTransitions(t, numTransitions, start)

		fakeLokiClient := NewFakeLokiClient()
		store := createTestLokiStore(t, sql, fakeLokiClient)

		t.Run("can query history by alert id", func(t *testing.T) {
			fakeLokiClient.Response = []historian.Stream{
				historian.StatesToStream(ruleMetaFromRule(t, dashAlert1), transitions, map[string]string{}, log.NewNopLogger()),
			}

			query := annotations.ItemQuery{
				OrgID:   1,
				AlertID: dashAlert1.ID,
				From:    start.Unix(),
				To:      start.Add(time.Second * time.Duration(numTransitions)).Unix(),
			}
			res, err := store.Get(
				context.Background(),
				&query,
				annotation_ac.AccessResources{
					Dashboards: map[string]int64{
						dashboard1.UID: dashboard1.ID,
					},
					ScopeTypes: map[any]struct{}{
						testutil.DashScopeType: {},
					},
				},
			)
			require.NoError(t, err)
			require.Len(t, res, numTransitions)
		})

		t.Run("can query history by dashboard id", func(t *testing.T) {
			fakeLokiClient.Response = []historian.Stream{
				historian.StatesToStream(ruleMetaFromRule(t, dashAlert1), transitions, map[string]string{}, log.NewNopLogger()),
				historian.StatesToStream(ruleMetaFromRule(t, dashAlert2), transitions, map[string]string{}, log.NewNopLogger()),
			}

			query := annotations.ItemQuery{
				OrgID:       1,
				DashboardID: dashboard1.ID,
				From:        start.Unix(),
				To:          start.Add(time.Second * time.Duration(numTransitions)).Unix(),
			}
			res, err := store.Get(
				context.Background(),
				&query,
				annotation_ac.AccessResources{
					Dashboards: map[string]int64{
						dashboard1.UID: dashboard1.ID,
					},
					ScopeTypes: map[any]struct{}{
						testutil.DashScopeType: {},
					},
				},
			)
			require.NoError(t, err)
			require.Len(t, res, 2*numTransitions)
		})

		t.Run("should only include history from dashboards in scope", func(t *testing.T) {
			fakeLokiClient.Response = []historian.Stream{
				historian.StatesToStream(ruleMetaFromRule(t, dashAlert1), transitions, map[string]string{}, log.NewNopLogger()),
				historian.StatesToStream(ruleMetaFromRule(t, dashAlert2), transitions, map[string]string{}, log.NewNopLogger()),
				historian.StatesToStream(ruleMetaFromRule(t, dashAlert3), transitions, map[string]string{}, log.NewNopLogger()),
			}

			query := annotations.ItemQuery{
				OrgID: 1,
				From:  start.Unix(),
				To:    start.Add(time.Second * time.Duration(numTransitions)).Unix(),
			}
			res, err := store.Get(
				context.Background(),
				&query,
				annotation_ac.AccessResources{
					Dashboards: map[string]int64{
						dashboard2.UID: dashboard2.ID,
					},
					ScopeTypes: map[any]struct{}{
						testutil.DashScopeType: {},
					},
				},
			)
			require.NoError(t, err)
			require.Len(t, res, numTransitions)
		})

		t.Run("should only include history without linked dashboard on org scope", func(t *testing.T) {
			query := annotations.ItemQuery{
				OrgID: 1,
				From:  start.Unix(),
				To:    start.Add(time.Second * time.Duration(numTransitions)).Unix(),
			}

			fakeLokiClient.Response = []historian.Stream{
				historian.StatesToStream(ruleMetaFromRule(t, dashAlert1), transitions, map[string]string{}, log.NewNopLogger()),
				historian.StatesToStream(ruleMetaFromRule(t, dashAlert2), transitions, map[string]string{}, log.NewNopLogger()),
				historian.StatesToStream(ruleMetaFromRule(t, dashAlert3), transitions, map[string]string{}, log.NewNopLogger()),
				historian.StatesToStream(ruleMetaFromRule(t, orgAlert1), transitions, map[string]string{}, log.NewNopLogger()),
			}

			res, err := store.Get(
				context.Background(),
				&query,
				annotation_ac.AccessResources{
					Dashboards: map[string]int64{},
					ScopeTypes: map[any]struct{}{
						testutil.OrgScopeType: {},
					},
				},
			)
			require.NoError(t, err)
			require.Len(t, res, numTransitions)
		})

		t.Run("should not find any when item is outside time range", func(t *testing.T) {
			query := annotations.ItemQuery{
				OrgID:       1,
				DashboardID: dashboard1.ID,
				From:        start.Add(-2 * time.Second).Unix(),
				To:          start.Add(-1 * time.Second).Unix(),
			}
			res, err := store.Get(
				context.Background(),
				&query,
				annotation_ac.AccessResources{
					Dashboards: map[string]int64{
						dashboard1.UID: dashboard1.ID,
					},
					ScopeTypes: map[any]struct{}{
						testutil.DashScopeType: {},
					},
				},
			)
			require.NoError(t, err)
			require.Len(t, res, 0)
		})
	})
}

func TestIntegrationGetRule(t *testing.T) {
	sql := db.InitTestDB(t)

	store := createTestLokiStore(t, sql, NewFakeLokiClient())

	rule := createAlertRuleWithDashboard(t, sql, nil, "Alert Rule", "dashboardUID")

	t.Run("should get rule by UID", func(t *testing.T) {
		query := ruleQuery{
			OrgID: 1,
			UID:   rule.UID,
		}

		dbRule, err := store.getRule(context.Background(), query)
		require.NoError(t, err)
		require.Equal(t, rule.ID, dbRule.ID)
		require.Equal(t, rule.UID, dbRule.UID)
	})

	t.Run("should get rule by ID", func(t *testing.T) {
		query := ruleQuery{
			OrgID: 1,
			ID:    rule.ID,
		}

		dbRule, err := store.getRule(context.Background(), query)
		require.NoError(t, err)
		require.Equal(t, rule.ID, dbRule.ID)
		require.Equal(t, rule.UID, dbRule.UID)
	})
}

func TestItemsFromStreams(t *testing.T) {
	sql := db.InitTestDB(t)
	store := createTestLokiStore(t, sql, NewFakeLokiClient())

	t.Run("should return empty list when no streams", func(t *testing.T) {
		items := store.itemsFromStreams(context.Background(), 1, []historian.Stream{}, annotation_ac.AccessResources{})
		require.Empty(t, items)
	})

	t.Run("should return empty list when no entries", func(t *testing.T) {
		items := store.itemsFromStreams(context.Background(), 1, []historian.Stream{
			{
				Values: []historian.Sample{},
			},
		}, annotation_ac.AccessResources{})
		require.Empty(t, items)
	})

	t.Run("should return one annotation per stream+sample", func(t *testing.T) {
	})
}

func TestFloat64Map(t *testing.T) {
	t.Run(`should convert json string:float kv to Golang map[string]float64`, func(t *testing.T) {
		jsonMap := simplejson.NewFromAny(map[string]any{
			"key1": json.Number("1.0"),
			"key2": json.Number("2.0"),
		})

		golangMap, err := float64Map(jsonMap)
		require.NoError(t, err)

		require.Equal(t, map[string]float64{
			"key1": 1.0,
			"key2": 2.0,
		}, golangMap)
	})

	t.Run("should return error when json map contains non-float values", func(t *testing.T) {
		jsonMap := simplejson.NewFromAny(map[string]any{
			"key1": json.Number("1.0"),
			"key2": "not a float",
		})

		_, err := float64Map(jsonMap)
		require.Error(t, err)
	})
}

func TestParseFormattedState(t *testing.T) {
	t.Run("should parse formatted state", func(t *testing.T) {
		stateStr := "Normal (MissingSeries)"
		s, reason, err := parseFormattedState(stateStr)
		require.NoError(t, err)

		require.Equal(t, eval.Normal, s)
		require.Equal(t, ngmodels.StateReasonMissingSeries, reason)
	})

	t.Run("should return error when formatted state is invalid", func(t *testing.T) {
		stateStr := "NotAState"
		_, _, err := parseFormattedState(stateStr)
		require.Error(t, err)
	})
}

func TestBuildTransitionStub(t *testing.T) {
	t.Run("should build stub correctly", func(t *testing.T) {
		now := time.Now()

		values := map[string]float64{
			"key1": 1.0,
			"key2": 2.0,
		}
		labels := map[string]string{
			"key1": "value1",
			"key2": "value2",
		}

		expected := &state.StateTransition{
			PreviousState:       eval.Error,
			PreviousStateReason: ngmodels.StateReasonNoData,
			State: &state.State{
				LastEvaluationTime: now,
				State:              eval.Normal,
				Values:             values,
				Labels:             labels,
			},
		}

		jsonValues := simplejson.New()
		for k, v := range values {
			jsonValues.Set(k, json.Number(strconv.FormatFloat(v, 'f', -1, 64)))
		}

		stub, err := buildTransitionStub(
			&historian.LokiEntry{
				Current:        "Normal",
				Previous:       "Error (NoData)",
				Values:         jsonValues,
				InstanceLabels: labels,
			},
			now,
		)

		require.NoError(t, err)
		require.Equal(t, expected, stub)
	})

	t.Run("fails when passed map with non-float values", func(t *testing.T) {
		_, err := buildTransitionStub(
			&historian.LokiEntry{
				Current:  "Normal",
				Previous: "Error (NoData)",
				Values:   simplejson.NewFromAny(map[string]any{"key1": "not a float"}),
				InstanceLabels: map[string]string{
					"key1": "value1",
					"key2": "value2",
				},
			},
			time.Now(),
		)

		require.Error(t, err)
	})
}

func TestBuildAnnotationItem(t *testing.T) {
	values := map[string]float64{
		"key1": 1.0,
		"key2": 2.0,
	}

	entry := &historian.LokiEntry{
		Current:      "Normal",
		Previous:     "Error (NoData)",
		DashboardUID: "dashboardUID",
		PanelID:      123,
	}

	dashID := int64(123)
	rule := &ngmodels.AlertRule{
		ID:    456,
		Title: "Test Rule",
	}
	s := &state.State{
		State:              eval.Normal,
		LastEvaluationTime: time.Now(),
		Values:             values,
		Labels: map[string]string{
			"key1": "value1",
			"key2": "value2",
		},
	}

	item, err := buildAnnotationItem(entry, dashID, rule, s)
	require.NoError(t, err)

	expectedText := fmt.Sprintf("Test Rule {key1=value1, key2=value2} - key1=%f, key2=%f", values["key1"], values["key2"])
	expectedData := simplejson.NewFromAny(map[string]any{
		"values": simplejson.NewFromAny(map[string]any{
			"key1": 1.0,
			"key2": 2.0,
		}),
	})

	require.Equal(t, &annotations.ItemDTO{
		AlertID:      rule.ID,
		AlertName:    rule.Title,
		DashboardID:  dashID,
		DashboardUID: &entry.DashboardUID,
		PanelID:      entry.PanelID,
		NewState:     entry.Current,
		PrevState:    entry.Previous,
		Time:         s.LastEvaluationTime.UnixMilli(),
		Text:         expectedText,
		Data:         expectedData,
	}, item)
}

func createTestLokiStore(t *testing.T, sql db.DB, client lokiQueryClient) *AlertStateHistoryStore {
	t.Helper()

	return &AlertStateHistoryStore{
		client: client,
		db:     sql,
		log:    log.NewNopLogger(),
	}
}

func createAlertRule(t *testing.T, sql db.DB, knownUIDs *sync.Map, title string) *ngmodels.AlertRule {
	t.Helper()

	if knownUIDs == nil {
		knownUIDs = &sync.Map{}
	}

	generator := ngmodels.AlertRuleGen(
		ngmodels.WithTitle(title),
		ngmodels.WithUniqueUID(knownUIDs),
		ngmodels.WithUniqueID(),
		ngmodels.WithOrgID(1),
	)

	rule := generator()

	err := sql.WithDbSession(context.Background(), func(sess *db.Session) error {
		_, err := sess.Table(ngmodels.AlertRule{}).InsertOne(rule)
		if err != nil {
			return err
		}

		dbRule := &ngmodels.AlertRule{}
		exist, err := sess.Table(ngmodels.AlertRule{}).ID(rule.ID).Get(dbRule)
		if err != nil {
			return err
		}
		if !exist {
			return errors.New("cannot read inserted record")
		}
		rule = dbRule

		return nil
	})
	require.NoError(t, err)

	return rule
}

func createAlertRuleWithDashboard(t *testing.T, sql db.DB, knownUIDs *sync.Map, title string, dashboardUID string) *ngmodels.AlertRule {
	t.Helper()

	if knownUIDs == nil {
		knownUIDs = &sync.Map{}
	}

	generator := ngmodels.AlertRuleGen(
		ngmodels.WithTitle(title),
		ngmodels.WithUniqueUID(knownUIDs),
		ngmodels.WithUniqueID(),
		ngmodels.WithOrgID(1),
		ngmodels.WithDashboardUID(dashboardUID),
	)

	rule := generator()

	err := sql.WithDbSession(context.Background(), func(sess *db.Session) error {
		_, err := sess.Table(ngmodels.AlertRule{}).InsertOne(rule)
		if err != nil {
			return err
		}

		dbRule := &ngmodels.AlertRule{}
		exist, err := sess.Table(ngmodels.AlertRule{}).ID(rule.ID).Get(dbRule)
		if err != nil {
			return err
		}
		if !exist {
			return errors.New("cannot read inserted record")
		}
		rule = dbRule

		return nil
	})
	require.NoError(t, err)

	return rule
}

func ruleMetaFromRule(t *testing.T, rule *ngmodels.AlertRule) historymodel.RuleMeta {
	t.Helper()

	meta := historymodel.RuleMeta{
		OrgID: rule.OrgID,
		UID:   rule.UID,
		ID:    rule.ID,
	}

	if rule.DashboardUID != nil {
		meta.DashboardUID = *rule.DashboardUID
	}

	if rule.PanelID != nil {
		meta.PanelID = *rule.PanelID
	}

	return meta
}

func genStateTransitions(t *testing.T, num int, start time.Time) []state.StateTransition {
	t.Helper()

	transitions := make([]state.StateTransition, 0, num)
	lastState := state.State{
		State:              eval.Normal,
		StateReason:        "",
		LastEvaluationTime: start,
		Values: map[string]float64{
			"key1": 1.0,
			"key2": 2.0,
		},
		Labels: map[string]string{
			"key1": "value1",
			"key2": "value2",
		},
	}

	for i := 0; i < num; i++ {
		stateVal := rand.Intn(4)
		if stateVal == int(lastState.State) {
			stateVal = (stateVal + 1) % 4
		}

		newState := state.State{
			State:              eval.State(stateVal),
			StateReason:        "",
			LastEvaluationTime: lastState.LastEvaluationTime.Add(time.Second * time.Duration(i)),
			Values:             lastState.Values,
			Labels:             lastState.Labels,
		}

		transitions = append(transitions, state.StateTransition{
			PreviousState:       lastState.State,
			PreviousStateReason: lastState.StateReason,
			State:               &newState,
		})

		lastState = newState
	}

	return transitions
}

type FakeLokiClient struct {
	client   client.Requester
	cfg      historian.LokiConfig
	metrics  *metrics.Historian
	log      log.Logger
	Response []historian.Stream
}

func NewFakeLokiClient() *FakeLokiClient {
	url, _ := url.Parse("http://some.url")
	req := historian.NewFakeRequester()
	metrics := metrics.NewHistorianMetrics(prometheus.NewRegistry())

	return &FakeLokiClient{
		client: client.NewTimedClient(req, metrics.WriteDuration),
		cfg: historian.LokiConfig{
			WritePathURL: url,
			ReadPathURL:  url,
			Encoder:      historian.JsonEncoder{},
		},
		metrics: metrics,
		log:     log.New("ngalert.state.historian", "backend", "loki"),
	}
}

func (c *FakeLokiClient) RangeQuery(ctx context.Context, query string, from, to, limit int64) (historian.QueryRes, error) {
	res := historian.QueryRes{
		Data: historian.QueryData{
			Result: c.Response,
		},
	}
	// reset expected streams on read
	c.Response = []historian.Stream{}
	return res, nil
}
