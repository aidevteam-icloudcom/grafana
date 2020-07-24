package live

import (
	"net/http"

	"github.com/centrifugal/centrifuge"
	"github.com/grafana/grafana/pkg/infra/log"
	"github.com/grafana/grafana/pkg/models"
)

var (
	logger = log.New("live")
)

// GrafanaLive pretends to be the server
type GrafanaLive struct {
	node    *centrifuge.Node
	Handler interface{} // handler func
}

// InitalizeBroker the broker and start listening for requests
func InitalizeBroker() (*GrafanaLive, error) {
	// We use default config here as starting point. Default config contains
	// reasonable values for available options.
	cfg := centrifuge.DefaultConfig

	// Node is the core object in Centrifuge library responsible for many useful
	// things. For example Node allows to publish messages to channels from server
	// side with its Publish method, but in this example we will publish messages
	// only from client side.
	node, err := centrifuge.New(cfg)
	if err != nil {
		return nil, err
	}

	b := &GrafanaLive{
		node: node,
	}

	// Set ConnectHandler called when client successfully connected to Node. Your code
	// inside handler must be synchronized since it will be called concurrently from
	// different goroutines (belonging to different client connections). This is also
	// true for other event handlers.
	node.OnConnect(func(c *centrifuge.Client) {
		// In our example transport will always be Websocket but it can also be SockJS.
		transportName := c.Transport().Name()
		// In our example clients connect with JSON protocol but it can also be Protobuf.
		transportEncoding := c.Transport().Encoding()
		logger.Info("client connected via %s (%s)", transportName, transportEncoding)
	})

	// Set SubscribeHandler to react on every channel subscription attempt
	// initiated by client. Here you can theoretically return an error or
	// disconnect client from server if needed. But now we just accept
	// all subscriptions to all channels. In real life you may use a more
	// complex permission check here.
	node.OnSubscribe(func(c *centrifuge.Client, e centrifuge.SubscribeEvent) (centrifuge.SubscribeReply, error) {
		logger.Info("client subscribes on channel %s", e.Channel)

		return centrifuge.SubscribeReply{}, nil
	})

	node.OnUnsubscribe(func(c *centrifuge.Client, e centrifuge.UnsubscribeEvent) {
		s, _ := node.PresenceStats(e.Channel)

		logger.Info("client unsubscribe from channel %s (clients:%d, users:%d)", e.Channel, s.NumClients, s.NumUsers)
	})

	// By default, clients can not publish messages into channels. By setting
	// PublishHandler we tell Centrifuge that publish from client side is possible.
	// Now each time client calls publish method this handler will be called and
	// you have a possibility to validate publication request before message will
	// be published into channel and reach active subscribers. In our simple chat
	// app we allow everyone to publish into any channel.
	node.OnPublish(func(c *centrifuge.Client, e centrifuge.PublishEvent) (centrifuge.PublishReply, error) {
		logger.Info("client publishes into channel %s: %s", e.Channel, string(e.Data))
		return centrifuge.PublishReply{}, nil
	})

	// Set Disconnect handler to react on client disconnect events.
	node.OnDisconnect(func(c *centrifuge.Client, e centrifuge.DisconnectEvent) {
		logger.Info("client disconnected")
	})

	// Run node. This method does not block.
	if err := node.Run(); err != nil {
		return nil, err
	}

	// SockJS will find the best protocol possible for the client
	sockJsPrefix := "/live/sockjs"
	sockjsHandler := centrifuge.NewSockjsHandler(node, centrifuge.SockjsConfig{
		URL:                      "https://cdn.jsdelivr.net/npm/sockjs-client@1/dist/sockjs.min.js", //??
		HandlerPrefix:            sockJsPrefix,
		WebsocketReadBufferSize:  1024,
		WebsocketWriteBufferSize: 1024,
		CheckOrigin: func(r *http.Request) bool {
			logger.Info("CheckOrigin? %s", r.RemoteAddr)
			return true
		},
		WebsocketCheckOrigin: func(r *http.Request) bool {
			logger.Info("WebsocketCheckOrigin? %s", r.RemoteAddr)
			return true
		},
	})

	b.Handler = func(ctx *models.ReqContext) {
		logger.Info("live request")

		// Put authentication Credentials into request Context. Since we don't
		// have any session backend here we simply set user ID as empty string.
		// Users with empty ID called anonymous users, in real app you should
		// decide whether anonymous users allowed to connect to your server
		// or not. There is also another way to set Credentials - returning them
		// from ConnectingHandler which is called after client sent first command
		// to server called Connect. See _examples folder in repo to find real-life
		// auth samples (OAuth2, Gin sessions, JWT etc).
		cred := &centrifuge.Credentials{
			UserID: "",
		}
		newCtx := centrifuge.SetCredentials(ctx.Req.Context(), cred)

		r := ctx.Req.Request
		r = r.WithContext(newCtx) // Set a user ID
		sockjsHandler.ServeHTTP(ctx.Resp, r)
	}
	return b, nil
}

// Publish sends the data to the channel
func (b *GrafanaLive) Publish(channel string, data []byte) bool {
	_, err := b.node.Publish(channel, data)
	if err != nil {
		return false
	}
	return true
}
