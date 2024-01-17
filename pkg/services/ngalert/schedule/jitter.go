package schedule

import (
	"fmt"
	"time"

	ngmodels "github.com/grafana/grafana/pkg/services/ngalert/models"
	"github.com/prometheus/prometheus/model/labels"
)

type JitterStrategy int

const (
	JitterNever JitterStrategy = iota
	JitterByGroup
	JitterByRule
)

// jitterOffsetInTicks gives the jitter offset for a rule, in terms of a number of ticks relative to its interval and a base interval.
// The resulting number of ticks is non-negative.
func jitterOffsetInTicks(r *ngmodels.AlertRule, baseInterval time.Duration, strategy JitterStrategy) int64 {
	if strategy == JitterNever {
		return 0
	}

	itemFrequency := r.IntervalSeconds / int64(baseInterval.Seconds())
	offset := jitterHash(r, strategy) % uint64(itemFrequency)
	// Offset is always nonnegative and less than int64.max, because above we mod by itemFrequency which fits in the positive half of int64.
	// offset <= itemFrequency <= int64.max
	// So, this will not overflow and produce a negative offset.
	//
	// Regardless, take an absolute value anyway for an extra layer of safety in case the above logic ever changes.
	// Our contract requires that the result is nonnegative and less than int64.max.
	res := int64(offset)
	if res < 0 {
		return -res
	}
	return res
}

func jitterHash(r *ngmodels.AlertRule, strategy JitterStrategy) uint64 {
	l := labels.New(
		labels.Label{Name: "name", Value: r.RuleGroup},
		labels.Label{Name: "file", Value: r.NamespaceUID},
		labels.Label{Name: "orgId", Value: fmt.Sprint(r.OrgID)},
	)

	if strategy == JitterByRule {
		l = labels.New(append(l, labels.Label{
			Name: "uid", Value: r.UID,
		})...)
	}
	return l.Hash()
}
