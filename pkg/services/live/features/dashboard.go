package features

import (
	"encoding/json"

	"github.com/centrifugal/centrifuge"
	"github.com/grafana/grafana/pkg/models"
)

// DashboardEvent events related to dashboards
type dashboardEvent struct {
	UID       string `json:"uid"`
	Action    string `json:"action"` // saved, editing
	UserID    int64  `json:"userId,omitempty"`
	SessionID string `json:"sessionId,omitempty"`
}

// DashboardHandler manages all the `grafana/dashboard/*` channels
type DashboardHandler struct {
	Publisher models.ChannelPublisher
}

// GetHandlerForPath called on init
func (g *DashboardHandler) GetHandlerForPath(path string) (models.ChannelHandler, error) {
	return g, nil // all dashboards share the same handler
}

// OnSubscribe for now allows anyone to subscribe to any dashboard
func (h *DashboardHandler) OnSubscribe(c *centrifuge.Client, e centrifuge.SubscribeEvent) (centrifuge.SubscribeReply, error) {
	return centrifuge.SubscribeReply{
		Options: centrifuge.SubscribeOptions{
			Presence:  true,
			JoinLeave: true,
		},
	}, nil
}

// OnPublish is called when someone begins to edit a dashoard
func (h *DashboardHandler) OnPublish(c *centrifuge.Client, e centrifuge.PublishEvent) (centrifuge.PublishReply, error) {
	return centrifuge.PublishReply{
		Options: centrifuge.PublishOptions{},
	}, nil
}

// DashboardSaved should broadcast to the appropriate stream
func (g *DashboardHandler) publish(event dashboardEvent) error {
	msg, err := json.Marshal(event)
	if err != nil {
		return err
	}
	return g.Publisher("grafana/dashboard/"+event.UID, msg)
}

// DashboardSaved will broadcast to all connected dashboards
func (g *DashboardHandler) DashboardSaved(uid string, userID int64) error {
	return g.publish(dashboardEvent{
		UID:    uid,
		Action: "saved",
		UserID: userID,
	})
}

// DashboardDeleted will broadcast to all connected dashboards
func (g *DashboardHandler) DashboardDeleted(uid string, userID int64) error {
	return g.publish(dashboardEvent{
		UID:    uid,
		Action: "deleted",
		UserID: userID,
	})
}
