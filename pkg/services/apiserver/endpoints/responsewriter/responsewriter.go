package responsewriter

import (
	"bufio"
	"fmt"
	"io"
	"net/http"

	"k8s.io/apiserver/pkg/endpoints/responsewriter"
	"k8s.io/klog/v2"
)

var _ responsewriter.CloseNotifierFlusher = (*ResponseAdapter)(nil)
var _ http.ResponseWriter = (*ResponseAdapter)(nil)
var _ io.ReadCloser = (*ResponseAdapter)(nil)

// ResponseAdapter is an implementation of [http.ResponseWriter] that allows conversion to a [http.Response].
type ResponseAdapter struct {
	req      *http.Request
	res      *http.Response
	reader   io.ReadCloser
	writer   io.WriteCloser
	buffered *bufio.ReadWriter
}

// NewAdapter returns an initialized [ResponseAdapter].
func NewAdapter(req *http.Request) *ResponseAdapter {
	r, w := io.Pipe()
	writer := bufio.NewWriter(w)
	reader := bufio.NewReader(r)
	buffered := bufio.NewReadWriter(reader, writer)
	return &ResponseAdapter{
		req: req,
		res: &http.Response{
			Proto:      req.Proto,
			ProtoMajor: req.ProtoMajor,
			ProtoMinor: req.ProtoMinor,
			Header:     make(http.Header),
		},
		reader:   r,
		writer:   w,
		buffered: buffered,
	}
}

// Header implements [http.ResponseWriter].
// It returns the response headers to mutate within a handler.
func (ra *ResponseAdapter) Header() http.Header {
	return ra.res.Header
}

// Write implements [http.ResponseWriter].
func (ra *ResponseAdapter) Write(buf []byte) (int, error) {
	return ra.buffered.Write(buf)
}

// Read implements [io.Reader].
func (ra *ResponseAdapter) Read(buf []byte) (int, error) {
	return ra.buffered.Read(buf)
}

// WriteHeader implements [http.ResponseWriter].
func (ra *ResponseAdapter) WriteHeader(code int) {
	ra.res.StatusCode = code
	ra.res.Status = fmt.Sprintf("%03d %s", code, http.StatusText(code))
}

// Flush implements [http.Flusher].
func (ra *ResponseAdapter) Flush() {
	if ra.buffered.Writer.Buffered() == 0 {
		return
	}

	if err := ra.buffered.Writer.Flush(); err != nil {
		klog.Error("Error flushing response buffer: ", "error", err)
	}
}

// Response returns the [http.Response] generated by the [http.Handler].
func (ra *ResponseAdapter) Response() *http.Response {
	// make sure to set the status code to 200 if the request is a watch
	// this is to ensure that client-go uses a streamwatcher:
	// https://github.com/kubernetes/client-go/blob/76174b8af8cfd938018b04198595d65b48a69334/rest/request.go#L737
	if ra.res.StatusCode == 0 && ra.req.URL.Query().Get("watch") == "true" {
		ra.WriteHeader(http.StatusOK)
	}
	ra.res.Body = ra
	return ra.res
}

// Decorate implements [responsewriter.UserProvidedDecorator].
func (ra *ResponseAdapter) Unwrap() http.ResponseWriter {
	return ra
}

// CloseNotify implements [http.CloseNotifier].
func (ra *ResponseAdapter) CloseNotify() <-chan bool {
	ch := make(chan bool)
	go func() {
		<-ra.req.Context().Done()
		ch <- true
	}()
	return ch
}

// Close implements [io.Closer].
func (ra *ResponseAdapter) Close() error {
	return ra.reader.Close()
}

// CloseWriter should be called after the http.Handler has returned.
func (ra *ResponseAdapter) CloseWriter() error {
	ra.Flush()
	return ra.writer.Close()
}
