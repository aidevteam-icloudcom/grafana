package codegen

import (
	"github.com/grafana/grafana/pkg/kindsys"
	"github.com/grafana/thema"
)

// A KindGenStep generates a single output file from a single
// [kindsys.SomeDecl].
//
// Examples of SingleKindGenerators:
//   - [TSTypesGenerator]: Generate TS types for a single kind
//   - [KindInterfaceGenerator]: Generate [kindsys.Interface] implementation and Thema bindings for a single kind
type KindGenStep interface {
	// Name returns the name of the generator. For use in error output.
	Name() string
	// Generate takes a kindsys.SomeDecl and generates a single file. A nil, nil
	// return indicates the generator has nothing to do for the provided kind.
	Generate(*DeclForGen) (*GeneratedFile, error)
}

// A AggregateKindGenStep generates a single output file from a set of
// [kindsys.SomeDecl].
//
// Examples of MultiKindGenerators:
//   - [BaseCoreRegistryGenerator]: Generate a static registry of [kindsys.Interface] implementations.
//   - [TSSchemaIndexGenerator]: Generate a TypeScript module index that re-exports all generated types.
type AggregateKindGenStep interface {
	// Name returns the name of the generator. For use in error output.
	Name() string
	// Generate takes a set of kindsys.SomeDecl and generates a single file. A nil, nil
	// return indicates the generator has nothing to do for the provided kind.
	Generate([]*DeclForGen) (*GeneratedFile, error)
}

// GeneratedFile represents a single file generated by a KindGenStep
// and AggregateKindGenStep.
type GeneratedFile struct {
	// The path at which the generated file should be placed, relative to
	// the repository root.
	RelativePath string
	// Contents of the generated file.
	Data []byte
}

// TODO docs
func ForGen(rt *thema.Runtime, decl *kindsys.SomeDecl) (*DeclForGen, error) {
	lin, err := decl.BindKindLineage(rt)
	if err != nil {
		return nil, err
	}

	return &DeclForGen{
		SomeDecl: decl,
		lin:      lin,
	}, nil
}

// DeclForGen wraps [kindsys.SomeDecl] to provide trivial caching of
// the lineage declared by the kind (nil for raw kinds).
type DeclForGen struct {
	*kindsys.SomeDecl
	lin thema.Lineage
}

func (decl *DeclForGen) Lineage() thema.Lineage {
	return decl.lin
}

// func (decl *DeclForGen) Name() string {
// 	return machineNameFor(decl.Meta)
// }
//
// func (decl *DeclForGen) MachineName() string {
// 	// TODO get this from _actual_ meta once we have it in the kind DSL
// 	return strings.Title(machineNameFor(decl.Meta))
// }

func machineNameFor(m kindsys.SomeKindMeta) string {
	switch x := m.(type) {
	case kindsys.RawMeta:
		return x.MachineName
	case kindsys.CoreStructuredMeta:
		return x.MachineName
	case kindsys.CustomStructuredMeta:
		return x.MachineName
	case kindsys.SlotImplMeta:
		return x.MachineName
	default:
		// unreachable so long as all the possibilities in KindMetas have switch branches
		panic("unreachable")
	}
}

func nameFor(m kindsys.SomeKindMeta) string {
	switch x := m.(type) {
	case kindsys.RawMeta:
		return x.Name
	case kindsys.CoreStructuredMeta:
		return x.Name
	case kindsys.CustomStructuredMeta:
		return x.Name
	case kindsys.SlotImplMeta:
		return x.Name
	default:
		// unreachable so long as all the possibilities in KindMetas have switch branches
		panic("unreachable")
	}
}

// genGoServiceRefs generates a file within the service directory for a
// structured kind with predictably-named type aliases to the kind's generated
// Go types.
type genGoServiceRefs struct{}

// var _ KindGenStep = &genGoServiceRefs{}
