package state

import (
	"errors"
	"testing"

	"github.com/grafana/grafana-plugin-sdk-go/data"
	"github.com/grafana/grafana/pkg/services/ngalert/eval"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	ptr "github.com/xorcare/pointer"
)

func TestTemplateCaptureValueStringer(t *testing.T) {
	cases := []struct {
		name     string
		value    templateCaptureValue
		expected string
	}{{
		name:     "nil value returns null",
		value:    templateCaptureValue{Value: nil},
		expected: "null",
	}, {
		name:     "1.0 is returned as integer value",
		value:    templateCaptureValue{Value: ptr.Float64(1.0)},
		expected: "1",
	}, {
		name:     "1.1 is returned as decimal value",
		value:    templateCaptureValue{Value: ptr.Float64(1.1)},
		expected: "1.1",
	}}

	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			assert.Equal(t, c.expected, c.value.String())
		})
	}
}

func TestExpandTemplate(t *testing.T) {
	cases := []struct {
		name          string
		text          string
		alertInstance eval.Result
		labels        data.Labels
		expected      string
		expectedError error
	}{{
		name:     "instance labels are expanded into $labels",
		text:     "{{ $labels.instance }} is down",
		labels:   data.Labels{"instance": "foo"},
		expected: "foo is down",
	}, {
		name:          "missing instance label returns error",
		text:          "{{ $labels.instance }} is down",
		labels:        data.Labels{},
		expectedError: errors.New("error executing template __alert_test: template: __alert_test:1:86: executing \"__alert_test\" at <$labels.instance>: map has no entry for key \"instance\""),
	}, {
		name: "values are expanded into $values",
		text: "{{ $values.A.Labels.instance }} has value {{ $values.A }}",
		alertInstance: eval.Result{
			Values: map[string]eval.NumberValueCapture{
				"A": {
					Var:    "A",
					Labels: data.Labels{"instance": "foo"},
					Value:  ptr.Float64(10),
				},
			},
		},
		expected: "foo has value 10",
	}, {
		name: "missing label in $values returns error",
		text: "{{ $values.A.Labels.instance }} has value {{ $values.A }}",
		alertInstance: eval.Result{
			Values: map[string]eval.NumberValueCapture{
				"A": {
					Var:    "A",
					Labels: data.Labels{},
					Value:  ptr.Float64(10),
				},
			},
		},
		expectedError: errors.New("error executing template __alert_test: template: __alert_test:1:86: executing \"__alert_test\" at <$values.A.Labels.instance>: map has no entry for key \"instance\""),
	}, {
		name: "value string is expanded into $value",
		text: "{{ $value }}",
		alertInstance: eval.Result{
			EvaluationString: "[ var='A' labels={instance=foo} value=10 ]",
		},
		expected: "[ var='A' labels={instance=foo} value=10 ]",
	}, {
		name: "float64 is humanized correctly",
		text: "{{ humanize $value }}",
		alertInstance: eval.Result{
			EvaluationString: "1234567.0",
		},
		expected: "1.235M",
	}, {
		name: "int is humanized correctly",
		text: "{{ humanize $value }}",
		alertInstance: eval.Result{
			EvaluationString: "1234567",
		},
		expected: "1.235M",
	}, {
		name: "humanize string with error",
		text: `{{ humanize $value }}`,
		alertInstance: eval.Result{
			EvaluationString: "invalid",
		},
		expectedError: errors.New(`error executing template __alert_test: template: __alert_test:1:79: executing "__alert_test" at <humanize $value>: error calling humanize: strconv.ParseFloat: parsing "invalid": invalid syntax`),
	}, {
		name: "humanize1024 float64",
		text: "{{ range $key, $val := $values }}{{ humanize1024 .Value }}:{{ end }}",
		alertInstance: eval.Result{
			Values: map[string]eval.NumberValueCapture{
				"A": {
					Var:    "A",
					Labels: data.Labels{},
					Value:  ptr.Float64(0.0),
				},
				"B": {
					Var:    "B",
					Labels: data.Labels{},
					Value:  ptr.Float64(1.0),
				},
				"C": {
					Var:    "C",
					Labels: data.Labels{},
					Value:  ptr.Float64(1048576.0),
				},
				"D": {
					Var:    "D",
					Labels: data.Labels{},
					Value:  ptr.Float64(.12),
				},
			},
		},
		expected: "0:1:1Mi:0.12:",
	}, {
		name: "humanize1024 string with error",
		text: "{{ humanize1024 $value }}",
		alertInstance: eval.Result{
			EvaluationString: "invalid",
		},
		expectedError: errors.New(`error executing template __alert_test: template: __alert_test:1:79: executing "__alert_test" at <humanize1024 $value>: error calling humanize1024: strconv.ParseFloat: parsing "invalid": invalid syntax`),
	}, {
		name: "humanizeDuration - seconds - float64",
		text: "{{ range $key, $val := $values }}{{ humanizeDuration .Value }}:{{ end }}",
		alertInstance: eval.Result{
			Values: map[string]eval.NumberValueCapture{
				"A": {
					Var:    "A",
					Labels: data.Labels{},
					Value:  ptr.Float64(0),
				},
				"B": {
					Var:    "B",
					Labels: data.Labels{},
					Value:  ptr.Float64(1),
				},
				"C": {
					Var:    "C",
					Labels: data.Labels{},
					Value:  ptr.Float64(60),
				},
				"D": {
					Var:    "D",
					Labels: data.Labels{},
					Value:  ptr.Float64(3600),
				},
				"E": {
					Var:    "E",
					Labels: data.Labels{},
					Value:  ptr.Float64(86400),
				},
				"F": {
					Var:    "F",
					Labels: data.Labels{},
					Value:  ptr.Float64(86400 + 3600),
				},
				"G": {
					Var:    "G",
					Labels: data.Labels{},
					Value:  ptr.Float64(-(86400*2 + 3600*3 + 60*4 + 5)),
				},
				"H": {
					Var:    "H",
					Labels: data.Labels{},
					Value:  ptr.Float64(899.99),
				},
			},
		},
		expected: "0s:1s:1m 0s:1h 0m 0s:1d 0h 0m 0s:1d 1h 0m 0s:-2d 3h 4m 5s:14m 59s:",
	}, {
		name: "humanizeDuration - string",
		text: "{{ humanizeDuration $value }}",
		alertInstance: eval.Result{
			EvaluationString: "86400",
		},
		expected: "1d 0h 0m 0s",
	}, {
		name: "humanizeDuration - subsecond and fractional seconds - float64",
		text: "{{ range $key, $val := $values }}{{ humanizeDuration .Value }}:{{ end }}",
		alertInstance: eval.Result{
			Values: map[string]eval.NumberValueCapture{
				"A": {
					Var:    "A",
					Labels: data.Labels{},
					Value:  ptr.Float64(.1),
				},
				"B": {
					Var:    "B",
					Labels: data.Labels{},
					Value:  ptr.Float64(.0001),
				},
				"C": {
					Var:    "C",
					Labels: data.Labels{},
					Value:  ptr.Float64(.12345),
				},
				"D": {
					Var:    "D",
					Labels: data.Labels{},
					Value:  ptr.Float64(60.1),
				},
				"E": {
					Var:    "E",
					Labels: data.Labels{},
					Value:  ptr.Float64(60.5),
				},
				"F": {
					Var:    "F",
					Labels: data.Labels{},
					Value:  ptr.Float64(1.2345),
				},
				"G": {
					Var:    "G",
					Labels: data.Labels{},
					Value:  ptr.Float64(12.345),
				},
			},
		},
		expected: "100ms:100us:123.5ms:1m 0s:1m 0s:1.234s:12.35s:",
	}, {
		name: "humanizeDuration - subsecond - string",
		text: "{{ humanizeDuration $value }}",
		alertInstance: eval.Result{
			EvaluationString: ".0001",
		},
		expected: "100us",
	}, {
		name: "humanizeDuration - fractional seconds - string",
		text: "{{ humanizeDuration $value }}",
		alertInstance: eval.Result{
			EvaluationString: "1.2345",
		},
		expected: "1.234s",
	}, {
		name: "humanizeDuration - string with error",
		text: `{{ humanizeDuration $value }}`,
		alertInstance: eval.Result{
			EvaluationString: "invalid",
		},
		expectedError: errors.New(`error executing template __alert_test: template: __alert_test:1:79: executing "__alert_test" at <humanizeDuration $value>: error calling humanizeDuration: strconv.ParseFloat: parsing "invalid": invalid syntax`),
	}, {
		name:     "humanizePercentage - float64",
		text:     "{{ -0.22222 | humanizePercentage }}:{{ 0.0 | humanizePercentage }}:{{ 0.1234567 | humanizePercentage }}:{{ 1.23456 | humanizePercentage }}",
		expected: "-22.22%:0%:12.35%:123.5%",
	}, {
		name:     "humanizePercentage - string",
		text:     `{{ "-0.22222" | humanizePercentage }}:{{ "0.0" | humanizePercentage }}:{{ "0.1234567" | humanizePercentage }}:{{ "1.23456" | humanizePercentage }}`,
		expected: "-22.22%:0%:12.35%:123.5%",
	}, {
		name:          "humanizePercentage - string with error",
		text:          `{{ "invalid" | humanizePercentage }}`,
		expectedError: errors.New(`error executing template __alert_test: template: __alert_test:1:91: executing "__alert_test" at <humanizePercentage>: error calling humanizePercentage: strconv.ParseFloat: parsing "invalid": invalid syntax`),
	}, {
		name:     "humanizeTimestamp - float64",
		text:     "{{ 1435065584.128 | humanizeTimestamp }}",
		expected: "2015-06-23 13:19:44.128 +0000 UTC",
	}, {
		name:     "humanizeTimestamp - string",
		text:     `{{ "1435065584.128" | humanizeTimestamp }}`,
		expected: "2015-06-23 13:19:44.128 +0000 UTC",
	},
	}

	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			v, err := expandTemplate("test", c.text, c.labels, c.alertInstance)
			require.Equal(t, c.expectedError, err)
			require.Equal(t, c.expected, v)
		})
	}
}
