package resource

import (
	"bytes"
	context "context"
	"fmt"
	"io"
	"math/rand"
	"sort"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/bwmarrin/snowflake"
	"go.opentelemetry.io/otel/trace"
	"go.opentelemetry.io/otel/trace/noop"
	"gocloud.dev/blob"
	_ "gocloud.dev/blob/fileblob"
	_ "gocloud.dev/blob/memblob"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
)

type CDKAppenderOptions struct {
	Tracer     trace.Tracer
	Bucket     *blob.Bucket
	RootFolder string

	// When running in a cluster, each node should have a different ID
	// This is used for snowflake generation and log identification
	NodeID int64

	// Get the next ResourceVersion.  When not set, this will default to snowflake IDs
	NextResourceVersion func() int64
}

func NewCDKAppendingStore(ctx context.Context, opts CDKAppenderOptions) (AppendingStore, error) {
	if opts.Tracer == nil {
		opts.Tracer = noop.NewTracerProvider().Tracer("cdk-appending-store")
	}

	if opts.Bucket == nil {
		return nil, fmt.Errorf("missing bucket")
	}

	found, _, err := opts.Bucket.ListPage(ctx, blob.FirstPageToken, 1, &blob.ListOptions{
		Prefix:    opts.RootFolder,
		Delimiter: "/",
	})
	if err != nil {
		return nil, err
	}
	if found == nil {
		return nil, fmt.Errorf("the root folder does not exist")
	}

	// This is not totally safe when running in HA
	if opts.NextResourceVersion == nil {
		if opts.NodeID == 0 {
			opts.NodeID = rand.Int63n(1024)
		}
		eventNode, err := snowflake.NewNode(opts.NodeID)
		if err != nil {
			return nil, apierrors.NewInternalError(
				fmt.Errorf("error initializing snowflake id generator :: %w", err))
		}
		opts.NextResourceVersion = func() int64 {
			return eventNode.Generate().Int64()
		}
	}

	return &cdkAppender{
		tracer: opts.Tracer,
		bucket: opts.Bucket,
		root:   opts.RootFolder,
		nextRV: opts.NextResourceVersion,
	}, nil
}

type cdkAppender struct {
	tracer trace.Tracer
	bucket *blob.Bucket
	root   string
	nextRV func() int64
	mutex  sync.Mutex

	// Typically one... the server wrapper
	subscribers []chan *WrittenEvent
}

func (s *cdkAppender) getPath(key *ResourceKey, rv int64) string {
	var buffer bytes.Buffer
	buffer.WriteString(s.root)

	if key.Group == "" {
		return buffer.String()
	}
	buffer.WriteString(key.Group)

	if key.Resource == "" {
		return buffer.String()
	}
	buffer.WriteString("/")
	buffer.WriteString(key.Resource)

	if key.Namespace == "" {
		if key.Name == "" {
			return buffer.String()
		}
		buffer.WriteString("/__cluster__")
	} else {
		buffer.WriteString("/")
		buffer.WriteString(key.Namespace)
	}

	if key.Name == "" {
		return buffer.String()
	}
	buffer.WriteString("/")
	buffer.WriteString(key.Name)

	if rv > 0 {
		buffer.WriteString(fmt.Sprintf("/%d.json", rv))
	}
	return buffer.String()
}

func (s *cdkAppender) WriteEvent(ctx context.Context, event WriteEvent) (rv int64, err error) {
	// Scope the lock
	{
		s.mutex.Lock()
		defer s.mutex.Unlock()

		rv = s.nextRV()
		err = s.bucket.WriteAll(ctx, s.getPath(event.Key, rv), event.Value, &blob.WriterOptions{
			ContentType: "application/json",
		})
	}

	// Async notify all subscribers
	if s.subscribers != nil {
		go func() {
			write := &WrittenEvent{
				WriteEvent: event,

				Timestamp:       time.Now().UnixMilli(),
				ResourceVersion: rv,
			}
			for _, sub := range s.subscribers {
				sub <- write
			}
		}()
	}

	return rv, err
}

// Read implements ResourceStoreServer.
func (s *cdkAppender) Read(ctx context.Context, req *ReadRequest) (*ReadResponse, error) {
	rv := req.ResourceVersion

	path := s.getPath(req.Key, req.ResourceVersion)
	if rv < 1 {
		iter := s.bucket.List(&blob.ListOptions{Prefix: path + "/", Delimiter: "/"})
		for {
			obj, err := iter.Next(ctx)
			if err == io.EOF {
				break
			}
			if strings.HasSuffix(obj.Key, ".json") {
				idx := strings.LastIndex(obj.Key, "/") + 1
				edx := strings.LastIndex(obj.Key, ".")
				if idx > 0 {
					v, err := strconv.ParseInt(obj.Key[idx:edx], 10, 64)
					if err == nil && v > rv {
						rv = v
						path = obj.Key // find the path with biggest resource version
					}
				}
			}
		}
	}

	raw, err := s.bucket.ReadAll(ctx, path)
	if err == nil && bytes.Contains(raw, []byte(`"DeletedMarker"`)) {
		tmp := &unstructured.Unstructured{}
		err = tmp.UnmarshalJSON(raw)
		if err == nil && tmp.GetKind() == "DeletedMarker" {
			return nil, apierrors.NewNotFound(schema.GroupResource{
				Group:    req.Key.Group,
				Resource: req.Key.Resource,
			}, req.Key.Name)
		}
	}

	return &ReadResponse{
		ResourceVersion: rv,
		Value:           raw,
	}, err
}

// List implements AppendingStore.
func (s *cdkAppender) List(ctx context.Context, req *ListRequest) (*ListResponse, error) {
	resources, err := buildTree(ctx, s, req.Options.Key)
	if err != nil {
		return nil, err
	}

	rsp := &ListResponse{}
	for _, item := range resources {
		latest := item.versions[0]
		raw, err := s.bucket.ReadAll(ctx, latest.key)
		if err != nil {
			return nil, err
		}
		rsp.Items = append(rsp.Items, &ResourceWrapper{
			ResourceVersion: latest.rv,
			Value:           raw,
		})
	}
	return rsp, nil
}

// Watch implements AppendingStore.
func (s *cdkAppender) WatchWriteEvents(ctx context.Context) (<-chan *WrittenEvent, error) {
	stream := make(chan *WrittenEvent, 10)
	{
		s.mutex.Lock()
		defer s.mutex.Unlock()

		// Add the event stream
		s.subscribers = append(s.subscribers, stream)
	}

	// Wait for context done
	go func() {
		// Wait till the context is done
		<-ctx.Done()

		// Then remove the subscription
		s.mutex.Lock()
		defer s.mutex.Unlock()

		// Copy all streams without our listener
		subs := []chan *WrittenEvent{}
		for _, sub := range s.subscribers {
			if sub != stream {
				subs = append(subs, sub)
			}
		}
		s.subscribers = subs
	}()
	return stream, nil
}

// group > resource > namespace > name > versions
type cdkResource struct {
	prefix   string
	versions []cdkVersion
}
type cdkVersion struct {
	rv  int64
	key string
}

func buildTree(ctx context.Context, s *cdkAppender, key *ResourceKey) ([]cdkResource, error) {
	byPrefix := make(map[string]*cdkResource)

	path := s.getPath(key, 0)
	iter := s.bucket.List(&blob.ListOptions{Prefix: path, Delimiter: ""}) // "" is recursive
	for {
		obj, err := iter.Next(ctx)
		if err == io.EOF {
			break
		}
		if strings.HasSuffix(obj.Key, ".json") {
			idx := strings.LastIndex(obj.Key, "/") + 1
			edx := strings.LastIndex(obj.Key, ".")
			if idx > 0 {
				rv, err := strconv.ParseInt(obj.Key[idx:edx], 10, 64)
				if err == nil {
					prefix := obj.Key[:idx]
					res, ok := byPrefix[prefix]
					if !ok {
						res = &cdkResource{prefix: prefix}
						byPrefix[prefix] = res
					}

					res.versions = append(res.versions, cdkVersion{
						rv:  rv,
						key: obj.Key,
					})
				}
			}
		}
	}

	// Now sort all versions
	resources := make([]cdkResource, 0, len(byPrefix))
	for _, res := range byPrefix {
		sort.Slice(res.versions, func(i, j int) bool {
			return res.versions[i].rv > res.versions[j].rv
		})
		resources = append(resources, *res)
	}
	sort.Slice(resources, func(i, j int) bool {
		a := resources[i].versions[0].rv
		b := resources[j].versions[0].rv
		return a > b
	})

	return resources, nil
}
