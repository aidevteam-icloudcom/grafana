package alerting

import (
	"context"
	"time"
)

type EvalHandler interface {
	Eval(context *EvalContext)
}

type Scheduler interface {
	Tick(time time.Time, execQueue chan *Job)
	Update(rules []*Rule)
}

type Notifier interface {
	Notify(ctx context.Context, alertResult *EvalContext) error
	GetType() string
	NeedsImage() bool
	PassesFilter(rule *Rule) bool
}

type Condition interface {
	Eval(result *EvalContext)
}
