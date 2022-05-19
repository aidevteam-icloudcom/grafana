package state

import (
	"context"
	"fmt"
	"net/url"
	"strconv"
	"strings"
	"time"

	"github.com/grafana/grafana-plugin-sdk-go/data"

	"github.com/grafana/grafana/pkg/infra/log"
	"github.com/grafana/grafana/pkg/models"
	"github.com/grafana/grafana/pkg/services/annotations"
	"github.com/grafana/grafana/pkg/services/dashboards"
	"github.com/grafana/grafana/pkg/services/ngalert/eval"
	"github.com/grafana/grafana/pkg/services/ngalert/metrics"
	ngModels "github.com/grafana/grafana/pkg/services/ngalert/models"
	"github.com/grafana/grafana/pkg/services/ngalert/store"
	"github.com/grafana/grafana/pkg/services/sqlstore"
)

var ResendDelay = 30 * time.Second

// AlertInstanceManager defines the interface for querying the current alert instances.
type AlertInstanceManager interface {
	GetAll(orgID int64) []*AlertInstance
	GetInstancesForRuleUID(orgID int64, alertRuleUID string) []*AlertInstance
}

type Manager struct {
	log     log.Logger
	metrics *metrics.State

	cache       *cache
	quit        chan struct{}
	ResendDelay time.Duration

	ruleStore        store.RuleStore
	instanceStore    store.InstanceStore
	sqlStore         sqlstore.Store
	dashboardService dashboards.DashboardService
}

func NewManager(logger log.Logger, metrics *metrics.State, externalURL *url.URL,
	ruleStore store.RuleStore, instanceStore store.InstanceStore, sqlStore sqlstore.Store,
	dashboardService dashboards.DashboardService) *Manager {
	manager := &Manager{
		cache:            newCache(logger, metrics, externalURL),
		quit:             make(chan struct{}),
		ResendDelay:      ResendDelay, // TODO: make this configurable
		log:              logger,
		metrics:          metrics,
		ruleStore:        ruleStore,
		instanceStore:    instanceStore,
		sqlStore:         sqlStore,
		dashboardService: dashboardService,
	}
	go manager.recordMetrics()
	return manager
}

func (st *Manager) Close() {
	st.quit <- struct{}{}
}

func (st *Manager) Warm(ctx context.Context) {
	st.log.Info("warming cache for startup")
	st.ResetCache()

	orgIds, err := st.instanceStore.FetchOrgIds(ctx)
	if err != nil {
		st.log.Error("unable to fetch orgIds", "msg", err.Error())
	}

	var states []*AlertInstance
	for _, orgId := range orgIds {
		// Get Rules
		ruleCmd := ngModels.ListAlertRulesQuery{
			OrgID: orgId,
		}
		if err := st.ruleStore.ListAlertRules(ctx, &ruleCmd); err != nil {
			st.log.Error("unable to fetch previous state", "msg", err.Error())
		}

		ruleByUID := make(map[string]*ngModels.AlertRule, len(ruleCmd.Result))
		for _, rule := range ruleCmd.Result {
			ruleByUID[rule.UID] = rule
		}

		// Get Instances
		cmd := ngModels.ListAlertInstancesQuery{
			RuleOrgID: orgId,
		}
		if err := st.instanceStore.ListAlertInstances(ctx, &cmd); err != nil {
			st.log.Error("unable to fetch previous state", "msg", err.Error())
		}

		for _, entry := range cmd.Result {
			ruleForEntry, ok := ruleByUID[entry.RuleUID]
			if !ok {
				st.log.Error("rule not found for instance, ignoring", "rule", entry.RuleUID)
				continue
			}

			lbs := map[string]string(entry.Labels)
			cacheId, err := entry.Labels.StringKey()
			if err != nil {
				st.log.Error("error getting cacheId for entry", "msg", err.Error())
			}
			stateForEntry := &AlertInstance{
				AlertRuleUID:         entry.RuleUID,
				OrgID:                entry.RuleOrgID,
				CacheId:              cacheId,
				Labels:               lbs,
				EvaluationState:      translateInstanceState(entry.CurrentState),
				EvaluationReason:     translateInstanceReason(entry.CurrentReason),
				LastEvaluationString: "",
				StartsAt:             entry.CurrentStateSince,
				EndsAt:               entry.CurrentStateEnd,
				LastEvaluationTime:   entry.LastEvalTime,
				Annotations:          ruleForEntry.Annotations,
			}
			states = append(states, stateForEntry)
		}
	}

	for _, s := range states {
		st.set(s)
	}
}

func (st *Manager) getOrCreate(ctx context.Context, alertRule *ngModels.AlertRule, result eval.Result) *AlertInstance {
	return st.cache.getOrCreate(ctx, alertRule, result)
}

func (st *Manager) set(entry *AlertInstance) {
	st.cache.set(entry)
}

func (st *Manager) Get(orgID int64, alertRuleUID, stateId string) (*AlertInstance, error) {
	return st.cache.get(orgID, alertRuleUID, stateId)
}

// ResetCache is used to ensure a clean cache on startup.
func (st *Manager) ResetCache() {
	st.cache.reset()
}

// RemoveByRuleUID deletes all entries in the state manager that match the given rule UID.
func (st *Manager) RemoveByRuleUID(orgID int64, ruleUID string) {
	st.cache.removeByRuleUID(orgID, ruleUID)
}

func (st *Manager) ProcessEvalResults(ctx context.Context, alertRule *ngModels.AlertRule, results eval.Results) []*AlertInstance {
	st.log.Debug("state manager processing evaluation results", "uid", alertRule.UID, "resultCount", len(results))
	var states []*AlertInstance
	processedResults := make(map[string]*AlertInstance, len(results))
	for _, result := range results {
		s := st.setNextState(ctx, alertRule, result)
		states = append(states, s)
		processedResults[s.CacheId] = s
	}
	st.staleResultsHandler(ctx, alertRule, processedResults)
	return states
}

// Set the current state based on evaluation results
func (st *Manager) setNextState(ctx context.Context, alertRule *ngModels.AlertRule, result eval.Result) *AlertInstance {
	currentState := st.getOrCreate(ctx, alertRule, result)

	currentState.LastEvaluationTime = result.EvaluatedAt
	currentState.EvaluationDuration = result.EvaluationDuration
	currentState.Results = append(currentState.Results, Evaluation{
		EvaluationTime:  result.EvaluatedAt,
		EvaluationState: result.State,
		Values:          NewEvaluationValues(result.Values),
		Condition:       alertRule.Condition,
	})
	currentState.LastEvaluationString = result.EvaluationString
	currentState.TrimResults(alertRule)
	oldState := currentState.EvaluationState
	oldReason := currentState.EvaluationReason

	// The underlying reason for a state is always the result of the evaluation.
	currentState.EvaluationReason = result.State
	st.log.Debug("setting alert state", "uid", alertRule.UID)
	switch result.State {
	case eval.Normal:
		currentState.resultNormal(alertRule, result)
	case eval.Alerting:
		currentState.resultAlerting(alertRule, result)
	case eval.Error:
		currentState.resultError(alertRule, result)
	case eval.NoData:
		currentState.resultNoData(alertRule, result)
	case eval.Pending: // we do not emit results with this state
		// We don't have a "reason: pending", so reset the Reason field.
		currentState.EvaluationReason = oldReason
	}

	// Set Resolved property so the scheduler knows to send a postable alert
	// to Alertmanager.
	currentState.Resolved = oldState == eval.Alerting && currentState.EvaluationState == eval.Normal

	st.set(currentState)

	shouldUpdateAnnotation := oldState != currentState.EvaluationState || oldReason != currentState.EvaluationReason
	if shouldUpdateAnnotation {
		go st.annotateState(ctx, alertRule, currentState.Labels, result.EvaluatedAt, InstanceStateAndReason{State: currentState.EvaluationState, Reason: currentState.EvaluationReason}, InstanceStateAndReason{State: oldState, Reason: oldReason})
	}
	return currentState
}

func (st *Manager) GetAll(orgID int64) []*AlertInstance {
	return st.cache.getAll(orgID)
}

func (st *Manager) GetInstancesForRuleUID(orgID int64, alertRuleUID string) []*AlertInstance {
	return st.cache.getInstancesForRuleUID(orgID, alertRuleUID)
}

func (st *Manager) recordMetrics() {
	// TODO: parameterize?
	// Setting to a reasonable default scrape interval for Prometheus.
	dur := time.Duration(15) * time.Second
	ticker := time.NewTicker(dur)
	for {
		select {
		case <-ticker.C:
			st.log.Debug("recording state cache metrics", "now", time.Now())
			st.cache.recordMetrics()
		case <-st.quit:
			st.log.Debug("stopping state cache metrics recording", "now", time.Now())
			ticker.Stop()
			return
		}
	}
}

func (st *Manager) Put(states []*AlertInstance) {
	for _, s := range states {
		st.set(s)
	}
}

// TODO: why wouldn't you allow other types like NoData or Error?
func translateInstanceState(state ngModels.InstanceStateType) eval.State {
	switch {
	case state == ngModels.InstanceStateFiring:
		return eval.Alerting
	case state == ngModels.InstanceStateNormal:
		return eval.Normal
	default:
		return eval.Error
	}
}

func translateInstanceReason(reason ngModels.InstanceStateType) eval.State {
	// If there's nothing set in the database, use the "Normal" state.
	var result eval.State
	switch reason {
	case ngModels.InstanceStateFiring:
		result = eval.Alerting
	case ngModels.InstanceStateNormal:
		result = eval.Normal
	case ngModels.InstanceStateNoData:
		result = eval.NoData
	case ngModels.InstanceStateError:
		result = eval.Error
	case ngModels.InstanceStatePending:
		// We shouldn't actually see this one - we should never set the error to pending.
		result = eval.Pending
	default:
		result = eval.Normal
	}

	return result
}

// This struct provides grouping of state with reason, and string formatting.
type InstanceStateAndReason struct {
	State  eval.State
	Reason eval.State
}

func (i InstanceStateAndReason) String() string {
	r := fmt.Sprintf("%v", i.State)
	// We never want to write down (Normal) or (Alerting)
	if i.State != i.Reason && i.Reason != eval.Normal && i.Reason != eval.Alerting && i.Reason.IsValid() {
		r = r + fmt.Sprintf(" (%v)", i.Reason)
	}
	return r
}

func (st *Manager) annotateState(ctx context.Context, alertRule *ngModels.AlertRule, labels data.Labels, evaluatedAt time.Time, currentData, previousData InstanceStateAndReason) {
	st.log.Debug("alert state changed creating annotation", "alertRuleUID", alertRule.UID, "newState", currentData.String(), "oldState", previousData.String())

	labels = removePrivateLabels(labels)
	annotationText := fmt.Sprintf("%s {%s} - %s", alertRule.Title, labels.String(), currentData.String())

	item := &annotations.Item{
		AlertId:   alertRule.ID,
		OrgId:     alertRule.OrgID,
		PrevState: previousData.String(),
		NewState:  currentData.String(),
		Text:      annotationText,
		Epoch:     evaluatedAt.UnixNano() / int64(time.Millisecond),
	}

	dashUid, ok := alertRule.Annotations[ngModels.DashboardUIDAnnotation]
	if ok {
		panelUid := alertRule.Annotations[ngModels.PanelIDAnnotation]

		panelId, err := strconv.ParseInt(panelUid, 10, 64)
		if err != nil {
			st.log.Error("error parsing panelUID for alert annotation", "panelUID", panelUid, "alertRuleUID", alertRule.UID, "error", err.Error())
			return
		}

		query := &models.GetDashboardQuery{
			Uid:   dashUid,
			OrgId: alertRule.OrgID,
		}

		err = st.dashboardService.GetDashboard(ctx, query)
		if err != nil {
			st.log.Error("error getting dashboard for alert annotation", "dashboardUID", dashUid, "alertRuleUID", alertRule.UID, "error", err.Error())
			return
		}

		item.PanelId = panelId
		item.DashboardId = query.Result.Id
	}

	annotationRepo := annotations.GetRepository()
	if err := annotationRepo.Save(item); err != nil {
		st.log.Error("error saving alert annotation", "alertRuleUID", alertRule.UID, "error", err.Error())
		return
	}
}

func (st *Manager) staleResultsHandler(ctx context.Context, alertRule *ngModels.AlertRule, states map[string]*AlertInstance) {
	allInstances := st.GetInstancesForRuleUID(alertRule.OrgID, alertRule.UID)
	for _, s := range allInstances {
		_, ok := states[s.CacheId]
		if !ok && isItStale(s.LastEvaluationTime, alertRule.IntervalSeconds) {
			st.log.Debug("removing stale state entry", "orgID", s.OrgID, "alertRuleUID", s.AlertRuleUID, "cacheID", s.CacheId)
			st.cache.deleteEntry(s.OrgID, s.AlertRuleUID, s.CacheId)
			ilbs := ngModels.InstanceLabels(s.Labels)
			_, labelsHash, err := ilbs.StringAndHash()
			if err != nil {
				st.log.Error("unable to get labelsHash", "error", err.Error(), "orgID", s.OrgID, "alertRuleUID", s.AlertRuleUID)
			}

			if err = st.instanceStore.DeleteAlertInstance(ctx, s.OrgID, s.AlertRuleUID, labelsHash); err != nil {
				st.log.Error("unable to delete stale instance from database", "error", err.Error(), "orgID", s.OrgID, "alertRuleUID", s.AlertRuleUID, "cacheID", s.CacheId)
			}

			if s.EvaluationState == eval.Alerting {
				st.annotateState(ctx, alertRule, s.Labels, time.Now(),
					InstanceStateAndReason{State: eval.Normal, Reason: eval.Normal},
					InstanceStateAndReason{State: s.EvaluationState, Reason: s.EvaluationReason})
			}
		}
	}
}

func isItStale(lastEval time.Time, intervalSeconds int64) bool {
	return lastEval.Add(2 * time.Duration(intervalSeconds) * time.Second).Before(time.Now())
}

func removePrivateLabels(labels data.Labels) data.Labels {
	result := make(data.Labels)
	for k, v := range labels {
		if !strings.HasPrefix(k, "__") && !strings.HasSuffix(k, "__") {
			result[k] = v
		}
	}
	return result
}
