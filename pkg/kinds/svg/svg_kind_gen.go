// THIS FILE IS GENERATED. EDITING IS FUTILE.
//
// Generated by:
//     kinds/gen.go
// Using jennies:
//     RawKindJenny
//
// Run 'make gen-cue' from repository root to regenerate.

package svg

import (
	"github.com/grafana/grafana/pkg/kindsys"
)

// TODO standard generated docs
type Kind struct {
	decl kindsys.Decl[kindsys.RawMeta]
}

// type guard
var _ kindsys.Raw = &Kind{}

// TODO standard generated docs
func NewKind() (*Kind, error) {
	decl, err := kindsys.LoadCoreKind[kindsys.RawMeta]("kinds/raw/svg", nil, nil)
	if err != nil {
		return nil, err
	}

	return &Kind{
		decl: *decl,
	}, nil
}

// TODO standard generated docs
func (k *Kind) Name() string {
	return "SVG"
}

// TODO standard generated docs
func (k *Kind) MachineName() string {
	return "svg"
}

// TODO standard generated docs
func (k *Kind) Maturity() kindsys.Maturity {
	return k.decl.Meta.Maturity
}

// TODO standard generated docs
func (k *Kind) Decl() *kindsys.Decl[kindsys.RawMeta] {
	d := k.decl
	return &d
}
