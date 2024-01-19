// SPDX-License-Identifier: AGPL-3.0-only

// Code generated by informer-gen. DO NOT EDIT.

package v0alpha1

import (
	"context"
	time "time"

	servicev0alpha1 "github.com/grafana/grafana/pkg/apis/service/v0alpha1"
	clientset "github.com/grafana/grafana/pkg/generated/clientset/clientset"
	internalinterfaces "github.com/grafana/grafana/pkg/generated/informers/externalversions/internalinterfaces"
	v0alpha1 "github.com/grafana/grafana/pkg/generated/listers/service/v0alpha1"
	v1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	runtime "k8s.io/apimachinery/pkg/runtime"
	watch "k8s.io/apimachinery/pkg/watch"
	cache "k8s.io/client-go/tools/cache"
)

// ExternalNameInformer provides access to a shared informer and lister for
// ExternalNames.
type ExternalNameInformer interface {
	Informer() cache.SharedIndexInformer
	Lister() v0alpha1.ExternalNameLister
}

type externalNameInformer struct {
	factory          internalinterfaces.SharedInformerFactory
	tweakListOptions internalinterfaces.TweakListOptionsFunc
	namespace        string
}

// NewExternalNameInformer constructs a new informer for ExternalName type.
// Always prefer using an informer factory to get a shared informer instead of getting an independent
// one. This reduces memory footprint and number of connections to the server.
func NewExternalNameInformer(client clientset.Interface, namespace string, resyncPeriod time.Duration, indexers cache.Indexers) cache.SharedIndexInformer {
	return NewFilteredExternalNameInformer(client, namespace, resyncPeriod, indexers, nil)
}

// NewFilteredExternalNameInformer constructs a new informer for ExternalName type.
// Always prefer using an informer factory to get a shared informer instead of getting an independent
// one. This reduces memory footprint and number of connections to the server.
func NewFilteredExternalNameInformer(client clientset.Interface, namespace string, resyncPeriod time.Duration, indexers cache.Indexers, tweakListOptions internalinterfaces.TweakListOptionsFunc) cache.SharedIndexInformer {
	return cache.NewSharedIndexInformer(
		&cache.ListWatch{
			ListFunc: func(options v1.ListOptions) (runtime.Object, error) {
				if tweakListOptions != nil {
					tweakListOptions(&options)
				}
				return client.ServiceV0alpha1().ExternalNames(namespace).List(context.TODO(), options)
			},
			WatchFunc: func(options v1.ListOptions) (watch.Interface, error) {
				if tweakListOptions != nil {
					tweakListOptions(&options)
				}
				return client.ServiceV0alpha1().ExternalNames(namespace).Watch(context.TODO(), options)
			},
		},
		&servicev0alpha1.ExternalName{},
		resyncPeriod,
		indexers,
	)
}

func (f *externalNameInformer) defaultInformer(client clientset.Interface, resyncPeriod time.Duration) cache.SharedIndexInformer {
	return NewFilteredExternalNameInformer(client, f.namespace, resyncPeriod, cache.Indexers{cache.NamespaceIndex: cache.MetaNamespaceIndexFunc}, f.tweakListOptions)
}

func (f *externalNameInformer) Informer() cache.SharedIndexInformer {
	return f.factory.InformerFor(&servicev0alpha1.ExternalName{}, f.defaultInformer)
}

func (f *externalNameInformer) Lister() v0alpha1.ExternalNameLister {
	return v0alpha1.NewExternalNameLister(f.Informer().GetIndexer())
}
