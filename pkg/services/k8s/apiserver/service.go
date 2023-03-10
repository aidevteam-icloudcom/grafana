package apiserver

import (
	"context"
	"fmt"
	"net"
	"net/http"

	"github.com/grafana/dskit/services"
	"github.com/grafana/grafana/pkg/services/k8s/kine"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/apimachinery/pkg/runtime/serializer"
	genericapifilters "k8s.io/apiserver/pkg/endpoints/filters"
	genericapiserver "k8s.io/apiserver/pkg/server"
	"k8s.io/apiserver/pkg/util/notfoundhandler"
)

type Service interface {
	services.Service
}

type service struct {
	*services.BasicService

	etcdProvider kine.EtcdProvider

	stopCh    chan struct{}
	stoppedCh <-chan struct{}
}

var (
	// Scheme defines methods for serializing and deserializing API objects.
	Scheme = runtime.NewScheme()
	// Codecs provides methods for retrieving codecs and serializers for specific
	// versions and content types.
	Codecs = serializer.NewCodecFactory(Scheme)
)

func ProvideService(etcdProvider kine.EtcdProvider) (*service, error) {
	metav1.AddToGroupVersion(Scheme, schema.GroupVersion{Group: "", Version: "v1"})

	s := &service{
		etcdProvider: etcdProvider,
		stopCh:       make(chan struct{}),
	}

	s.BasicService = services.NewBasicService(s.start, s.running, nil)

	return s, nil
}

func (s *service) start(ctx context.Context) error {
	recommendedOptions, apiServerConfig, err := s.apiserverConfig()
	if err != nil {
		return fmt.Errorf("failed to create apiserver config: %w", err)
	}
	extensionsServerConfig, err := s.extensionsServerConfig(recommendedOptions, apiServerConfig)
	if err != nil {
		return fmt.Errorf("failed to create extensions server config: %w", err)
	}

	notFoundHandler := notfoundhandler.New(extensionsServerConfig.GenericConfig.Serializer, genericapifilters.NoMuxAndDiscoveryIncompleteKey)
	delegateAPIServer := genericapiserver.NewEmptyDelegateWithCustomHandler(notFoundHandler)

	extensionServer, err := extensionsServerConfig.Complete().New(delegateAPIServer)
	if err != nil {
		return err
	}

	apiServer, err := apiServerConfig.Complete().New("grafana", extensionServer.GenericAPIServer)
	if err != nil {
		return err
	}

	prepared := apiServer.PrepareRun()

	l, err := net.Listen("tcp", "127.0.0.1:6443")
	if err != nil {
		return err
	}

	stoppedCh, _, err := genericapiserver.RunServer(&http.Server{
		Addr:           "127.0.0.1:6443",
		Handler:        prepared.Handler,
		MaxHeaderBytes: 1 << 20,
	}, l, prepared.ShutdownTimeout, s.stopCh)
	if err != nil {
		return err
	}
	s.stoppedCh = stoppedCh

	return nil
}

func (s *service) running(ctx context.Context) error {
	select {
	case <-ctx.Done():
		close(s.stopCh)
	case <-s.stoppedCh:
	}
	return nil
}
