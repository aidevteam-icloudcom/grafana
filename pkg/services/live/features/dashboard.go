package features

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	"github.com/grafana/grafana-plugin-sdk-go/backend"

	"github.com/grafana/grafana/pkg/bus"
	"github.com/grafana/grafana/pkg/models"
	"github.com/grafana/grafana/pkg/services/guardian"
)

type actionType string

const (
	ACTION_SAVED     actionType = "saved"
	ACTION_DELETED   actionType = "deleted"
	EDITING_STARTED  actionType = "editing-started"
	EDITING_FINISHED actionType = "editing-finished"
)

// DashboardEvent events related to dashboards
type dashboardEvent struct {
	UID       string                 `json:"uid"`
	Action    actionType             `json:"action"` // saved, editing, deleted
	User      *models.UserDisplayDTO `json:"user,omitempty"`
	SessionID string                 `json:"sessionId,omitempty"`
	Message   string                 `json:"message,omitempty"`
	Dashboard *models.Dashboard      `json:"dashboard,omitempty"`
	Error     string                 `json:"error,omitempty"`
}

// DashboardHandler manages all the `grafana/dashboard/*` channels
type DashboardHandler struct {
	Publisher models.ChannelPublisher
	Presense  models.ChannelPresense
}

// GetHandlerForPath called on init
func (h *DashboardHandler) GetHandlerForPath(path string) (models.ChannelHandler, error) {
	return h, nil // all dashboards share the same handler
}

// OnSubscribe for now allows anyone to subscribe to any dashboard
func (h *DashboardHandler) OnSubscribe(ctx context.Context, user *models.SignedInUser, e models.SubscribeEvent) (models.SubscribeReply, backend.SubscribeStreamStatus, error) {
	parts := strings.Split(e.Path, "/")
	if parts[0] == "gitops" {
		// gitops gets all changes for everything, so lets make sure it is an admin user
		if !user.HasRole(models.ROLE_ADMIN) {
			return models.SubscribeReply{}, backend.SubscribeStreamStatusPermissionDenied, nil
		}
		return models.SubscribeReply{
			Presence:  true,
			JoinLeave: true, // ?? likely not necessary
		}, backend.SubscribeStreamStatusOK, nil

	}

	// make sure can view this dashboard
	if len(parts) == 2 && parts[0] == "uid" {
		query := models.GetDashboardQuery{Uid: parts[1], OrgId: user.OrgId}
		if err := bus.Dispatch(&query); err != nil {
			logger.Error("Unknown dashboard", "query", query)
			return models.SubscribeReply{}, backend.SubscribeStreamStatusNotFound, nil
		}

		dash := query.Result
		guardian := guardian.New(dash.Id, user.OrgId, user)
		if canView, err := guardian.CanView(); err != nil || !canView {
			return models.SubscribeReply{}, backend.SubscribeStreamStatusPermissionDenied, nil
		}

		return models.SubscribeReply{
			Presence:  true,
			JoinLeave: true,
		}, backend.SubscribeStreamStatusOK, nil
	}

	// Unknown path
	logger.Error("Unknown dashboard channel", "path", e.Path)
	return models.SubscribeReply{}, backend.SubscribeStreamStatusNotFound, nil
}

// OnPublish is called when someone begins to edit a dashboard
func (h *DashboardHandler) OnPublish(ctx context.Context, user *models.SignedInUser, e models.PublishEvent) (models.PublishReply, backend.PublishStreamStatus, error) {
	parts := strings.Split(e.Path, "/")
	if parts[0] == "gitops" {
		// gitops gets all changes for everything, so lets make sure it is an admin user
		if !user.HasRole(models.ROLE_ADMIN) {
			return models.PublishReply{}, backend.PublishStreamStatusPermissionDenied, nil
		}

		// Eventually this could broadcast a message back to the dashboard saying a pull request exists
		return models.PublishReply{}, backend.PublishStreamStatusNotFound, fmt.Errorf("not implemented yet")
	}

	// make sure can view this dashboard
	if len(parts) == 2 && parts[0] == "uid" {
		event := dashboardEvent{}
		err := json.Unmarshal(e.Data, &event)
		if err != nil || event.UID != parts[1] {
			return models.PublishReply{}, backend.SubscribeStreamStatusNotFound, fmt.Errorf("bad request")
		}
		if event.Action != EDITING_STARTED {
			// just ignore the event
			return models.PublishReply{}, backend.SubscribeStreamStatusNotFound, fmt.Errorf("ignore???")
		}
		query := models.GetDashboardQuery{Uid: parts[1], OrgId: user.OrgId}
		if err := bus.Dispatch(&query); err != nil {
			logger.Error("Unknown dashboard", "query", query)
			return models.PublishReply{}, backend.SubscribeStreamStatusNotFound, nil
		}

		guardian := guardian.New(query.Result.Id, user.OrgId, user)
		canEdit, err := guardian.CanEdit()
		if err != nil {
			return models.PublishReply{}, backend.SubscribeStreamStatusNotFound, fmt.Errorf("internal error")
		}

		// Ignore edit events if the user can not edit
		if !canEdit {
			return models.PublishReply{}, backend.SubscribeStreamStatusNotFound, nil // NOOP
		}

		// Tell everyone who is editing
		event.User = user.ToUserDisplayDTO()

		msg, err := json.Marshal(event)
		if err != nil {
			return models.PublishReply{}, backend.SubscribeStreamStatusNotFound, fmt.Errorf("internal error")
		}
		return models.PublishReply{Data: msg}, backend.PublishStreamStatusOK, nil
	}

	return models.PublishReply{}, backend.SubscribeStreamStatusNotFound, nil
}

// DashboardSaved should broadcast to the appropriate stream
func (h *DashboardHandler) publish(event dashboardEvent) error {
	msg, err := json.Marshal(event)
	if err != nil {
		return err
	}
	err = h.Publisher("grafana/dashboard/uid/"+event.UID, msg)
	if err != nil {
		return err
	}

	return h.Publisher("grafana/dashboard/gitops", msg)
}

// DashboardSaved will broadcast to all connected dashboards
func (h *DashboardHandler) DashboardSaved(user *models.UserDisplayDTO, message string, dashboard *models.Dashboard, err error) error {
	if err != nil && !h.HasGitOpsObserver() {
		return nil // only broadcast if it was OK
	}

	msg := dashboardEvent{
		UID:       dashboard.Uid,
		Action:    ACTION_SAVED,
		User:      user,
		Message:   message,
		Dashboard: dashboard,
	}

	return h.publish(msg)
}

// DashboardDeleted will broadcast to all connected dashboards
func (h *DashboardHandler) DashboardDeleted(user *models.UserDisplayDTO, uid string) error {
	return h.publish(dashboardEvent{
		UID:    uid,
		Action: ACTION_DELETED,
		User:   user,
	})
}

// HasGitOpsObserver will return true if anyone is listening to the `gitops` channel
func (h *DashboardHandler) HasGitOpsObserver() bool {
	presence, err := h.Presense("grafana")
	if err != nil {
		logger.Error("error getting presense for gitops", "error", err)
		return false
	}
	return len(presence) > 0
}
