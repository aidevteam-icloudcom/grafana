package eval

import (
	"testing"

	"github.com/grafana/grafana-plugin-sdk-go/data"
	"github.com/stretchr/testify/require"

	"github.com/grafana/grafana/pkg/expr/classic"
	"github.com/grafana/grafana/pkg/util"
)

func TestExtractEvalString(t *testing.T) {
	cases := []struct {
		desc      string
		inFrame   *data.Frame
		outString string
	}{
		{
			desc: "1 EvalMatch",
			inFrame: newMetaFrame([]classic.EvalMatch{
				{Metric: "Test", Labels: data.Labels{"host": "foo"}, Value: util.Pointer(32.3)},
			}, util.Pointer(1)),
			outString: `[ var='0' metric='Test' labels={host=foo} value=32.3 ]`,
		},
		{
			desc: "2 EvalMatches",
			inFrame: newMetaFrame([]classic.EvalMatch{
				{Metric: "Test", Labels: data.Labels{"host": "foo"}, Value: util.Pointer(32.3)},
				{Metric: "Test", Labels: data.Labels{"host": "baz"}, Value: util.Pointer(10)},
			}, util.Pointer(1), withRefID("A")),
			outString: `[ var='A0' metric='Test' labels={host=foo} value=32.3 ], [ var='A1' metric='Test' labels={host=baz} value=10 ]`,
		},
		{
			desc: "3 EvalMatches",
			inFrame: newMetaFrame([]classic.EvalMatch{
				{Metric: "Test", Labels: data.Labels{"host": "foo"}, Value: util.Pointer(32.3)},
				{Metric: "Test", Labels: data.Labels{"host": "baz"}, Value: util.Pointer(10)},
				{Metric: "TestA", Labels: data.Labels{"host": "zip"}, Value: util.Pointer(11)},
			}, util.Pointer(1), withRefID("A")),
			outString: `[ var='A0' metric='Test' labels={host=foo} value=32.3 ], [ var='A1' metric='Test' labels={host=baz} value=10 ], [ var='A2' metric='TestA' labels={host=zip} value=11 ]`,
		},
	}
	for _, tc := range cases {
		t.Run(tc.desc, func(t *testing.T) {
			require.Equal(t, tc.outString, extractEvalString(tc.inFrame))
		})
	}
}

func TestExtractValues(t *testing.T) {
	cases := []struct {
		desc    string
		inFrame *data.Frame
		values  map[string]NumberValueCapture
	}{{
		desc:    "No values in frame returns nil",
		inFrame: newMetaFrame(nil, util.Pointer(1)),
		values:  nil,
	}, {
		desc: "Classic condition frame with one match",
		inFrame: newMetaFrame([]classic.EvalMatch{
			{Metric: "A", Labels: data.Labels{"host": "foo"}, Value: util.Pointer(1)},
		}, util.Pointer(1), withRefID("A")),
		values: map[string]NumberValueCapture{
			"A0": {Var: "A", Labels: data.Labels{"host": "foo"}, Value: util.Pointer(1)},
		},
	}, {
		desc: "Classic condition frame with multiple matches",
		inFrame: newMetaFrame([]classic.EvalMatch{
			{Metric: "A", Labels: data.Labels{"host": "foo"}, Value: util.Pointer(1)},
			{Metric: "A", Labels: data.Labels{"host": "foo"}, Value: util.Pointer(3)},
		}, util.Pointer(1), withRefID("A")),
		values: map[string]NumberValueCapture{
			"A0": {Var: "A", Labels: data.Labels{"host": "foo"}, Value: util.Pointer(1)},
			"A1": {Var: "A", Labels: data.Labels{"host": "foo"}, Value: util.Pointer(3)},
		},
	}, {
		desc: "Nil value",
		inFrame: newMetaFrame([]NumberValueCapture{
			{Var: "A", Labels: data.Labels{"host": "foo"}, Value: nil},
		}, util.Pointer(1)),
		values: map[string]NumberValueCapture{
			"A": {Var: "A", Labels: data.Labels{"host": "foo"}, Value: nil},
		},
	}, {
		desc: "1 value",
		inFrame: newMetaFrame([]NumberValueCapture{
			{Var: "A", Labels: data.Labels{"host": "foo"}, Value: util.Pointer(1)},
		}, util.Pointer(1)),
		values: map[string]NumberValueCapture{
			"A": {Var: "A", Labels: data.Labels{"host": "foo"}, Value: util.Pointer(1)},
		},
	}, {
		desc: "2 values",
		inFrame: newMetaFrame([]NumberValueCapture{
			{Var: "A", Labels: data.Labels{"host": "foo"}, Value: util.Pointer(1)},
			{Var: "B", Labels: nil, Value: util.Pointer(2)},
		}, util.Pointer(1)),
		values: map[string]NumberValueCapture{
			"A": {Var: "A", Labels: data.Labels{"host": "foo"}, Value: util.Pointer(1)},
			"B": {Var: "B", Value: util.Pointer(2)},
		},
	}}
	for _, tc := range cases {
		t.Run(tc.desc, func(t *testing.T) {
			require.Equal(t, tc.values, extractValues(tc.inFrame))
		})
	}
}

type frameCallback func(frame *data.Frame)

func withRefID(refID string) frameCallback {
	return func(frame *data.Frame) {
		frame.RefID = refID
	}
}

func newMetaFrame(custom interface{}, val *float64, callbacks ...frameCallback) *data.Frame {
	f := data.NewFrame("",
		data.NewField("", nil, []*float64{val})).
		SetMeta(&data.FrameMeta{
			Custom: custom,
		})

	for _, cb := range callbacks {
		cb(f)
	}

	return f
}
