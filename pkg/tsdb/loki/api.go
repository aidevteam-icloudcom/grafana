package loki

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"io/ioutil"
	"net/http"
	"net/url"
	"strconv"

	"github.com/grafana/grafana/pkg/infra/log"
	"github.com/grafana/loki/pkg/loghttp"
	jsoniter "github.com/json-iterator/go"
)

type LokiAPI struct {
	client *http.Client
	url    string
	log    log.Logger
}

func newLokiAPI(client *http.Client, url string, log log.Logger) *LokiAPI {
	return &LokiAPI{client: client, url: url, log: log}
}

func makeDataRequest(ctx context.Context, lokiDsUrl string, query lokiQuery) (*http.Request, error) {
	qs := url.Values{}
	qs.Set("query", query.Expr)

	qs.Set("direction", string(query.Direction))

	// MaxLines defaults to zero when not received,
	// and Loki does not like limit=0, even when it is not needed
	// (for example for metric queries), so we
	// only send it when it's set
	if query.MaxLines > 0 {
		qs.Set("limit", fmt.Sprintf("%d", query.MaxLines))
	}

	lokiUrl, err := url.Parse(lokiDsUrl)
	if err != nil {
		return nil, err
	}

	switch query.QueryType {
	case QueryTypeRange:
		{
			qs.Set("start", strconv.FormatInt(query.Start.UnixNano(), 10))
			qs.Set("end", strconv.FormatInt(query.End.UnixNano(), 10))
			// NOTE: technically for streams-producing queries `step`
			// is ignored, so it would be nicer to not send it in such cases,
			// but we cannot detect that situation, so we always send it.
			// it should not break anything.
			// NOTE2: we do this at millisecond precision for two reasons:
			//  a. Loki cannot do steps with better precision anyway,
			//     so the microsecond & nanosecond part can be ignored.
			//  b. having it always be number+'ms' makes it more robust and
			//     precise, as Loki does not support step with float number
			//     and time-specifier, like "1.5s"
			qs.Set("step", fmt.Sprintf("%dms", query.Step.Milliseconds()))
			lokiUrl.Path = "/loki/api/v1/query_range"
		}
	case QueryTypeInstant:
		{
			qs.Set("time", strconv.FormatInt(query.End.UnixNano(), 10))
			lokiUrl.Path = "/loki/api/v1/query"
		}
	default:
		return nil, fmt.Errorf("invalid QueryType: %v", query.QueryType)
	}

	lokiUrl.RawQuery = qs.Encode()

	req, err := http.NewRequestWithContext(ctx, "GET", lokiUrl.String(), nil)
	if err != nil {
		return nil, err
	}

	// NOTE:
	// 1. we are missing "dynamic" http params, like OAuth data.
	// this never worked before (and it is not needed for alerting scenarios),
	// so it is not a regression.
	// twe need to have that when we migrate to backend-queries.
	//

	if query.VolumeQuery {
		req.Header.Set("X-Query-Tags", "Source=logvolhist")
	}

	return req, nil
}

type lokiError struct {
	Message string
}

// we know there is an error,
// based on the http-response-body
// we have to make an informative error-object
func makeLokiError(body io.ReadCloser) error {
	var buf bytes.Buffer
	_, err := buf.ReadFrom(body)
	if err != nil {
		return err
	}

	bytes := buf.Bytes()

	// the error-message is probably a JSON structure,
	// with a string-field named "message". we want the
	// value of that field.
	// but, the response might be just a simple string,
	// this was used in older Loki versions.
	// so our approach is this:
	// - we try to convert the bytes to JSON
	// - we take the value of the field "message"
	// - if any of these steps fail, or if "message" is empty, we return the whole text

	var data lokiError
	err = json.Unmarshal(bytes, &data)
	if err != nil {
		// we were unable to convert the bytes to JSON, we return the whole text
		return fmt.Errorf("%v", string(bytes))
	}

	errorMessage := data.Message

	if errorMessage == "" {
		// we got no usable error message, we return the whole text
		return fmt.Errorf("%v", string(bytes))
	}

	return fmt.Errorf("%v", errorMessage)
}

func (api *LokiAPI) DataQuery(ctx context.Context, query lokiQuery) (*loghttp.QueryResponse, error) {
	req, err := makeDataRequest(ctx, api.url, query)
	if err != nil {
		return nil, err
	}

	resp, err := api.client.Do(req)
	if err != nil {
		return nil, err
	}

	defer func() {
		if err := resp.Body.Close(); err != nil {
			api.log.Warn("Failed to close response body", "err", err)
		}
	}()

	if resp.StatusCode/100 != 2 {
		return nil, makeLokiError(resp.Body)
	}

	var response loghttp.QueryResponse
	err = jsoniter.NewDecoder(resp.Body).Decode(&response)
	if err != nil {
		return nil, err
	}

	return &response, nil
}

func makeRawRequest(ctx context.Context, lokiDsUrl string, resourceURL string) (*http.Request, error) {
	lokiUrl, err := url.Parse(lokiDsUrl)
	if err != nil {
		return nil, err
	}

	url, err := lokiUrl.Parse(resourceURL)
	if err != nil {
		return nil, err
	}

	return http.NewRequestWithContext(ctx, "GET", url.String(), nil)
}

func (api *LokiAPI) RawQuery(ctx context.Context, resourceURL string) ([]byte, error) {
	req, err := makeRawRequest(ctx, api.url, resourceURL)
	if err != nil {
		return nil, err
	}

	resp, err := api.client.Do(req)
	if err != nil {
		return nil, err
	}

	defer func() {
		if err := resp.Body.Close(); err != nil {
			api.log.Warn("Failed to close response body", "err", err)
		}
	}()

	if resp.StatusCode/100 != 2 {
		return nil, makeLokiError(resp.Body)
	}

	return io.ReadAll(resp.Body)
}

type mockedRoundTripper struct {
	statusCode    int
	responseBytes []byte
	contentType   string
	err           error
}

func (mockedRT *mockedRoundTripper) RoundTrip(req *http.Request) (*http.Response, error) {
	if mockedRT.err != nil {
		return nil, mockedRT.err
	}

	header := http.Header{}
	header.Add("Content-Type", mockedRT.contentType)
	return &http.Response{
		StatusCode: mockedRT.statusCode,
		Header:     header,
		Body:       ioutil.NopCloser(bytes.NewReader(mockedRT.responseBytes)),
	}, nil
}

func makeMockedAPI(statusCode int, contentType string, responseBytes []byte, err error) *LokiAPI {
	client := http.Client{
		Transport: &mockedRoundTripper{statusCode: statusCode, contentType: contentType, responseBytes: responseBytes, err: err},
	}

	return newLokiAPI(&client, "http://localhost:9999", log.New("test"))
}
