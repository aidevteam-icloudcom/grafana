package codegen

import (
	"path/filepath"

	"github.com/grafana/thema"
	"github.com/grafana/thema/encoding/tgo"
	"golang.org/x/tools/go/ast/astutil"
)

// GoTypesGenerator creates a [KindGenStep] that produces Go types for the latest
// Thema schema in a structured kind's lineage.
//
// At minimum, a gokindsdir must be provided. This should be the path to the parent
// directory of the directory in which the types should be generated, relative
// to the project root. For example, if the types for a kind named "foo"
// should live at pkg/kind/foo/foo_gen.go, relpath should be "pkg/kind".
//
// This generator is a no-op for raw kinds.
func GoTypesGenerator(gokindsdir string, cfg *GoTypesGeneratorConfig) KindGenStep {
	if cfg == nil {
		cfg = new(GoTypesGeneratorConfig)
	}
	if cfg.GenDirName == nil {
		cfg.GenDirName = func(decl *DeclForGen) string {
			return machineNameFor(decl.Meta)
		}
	}

	return &genGoTypes{
		gokindsdir: gokindsdir,
		cfg:        cfg,
	}
}

type GoTypesGeneratorConfig struct {
	// Apply is an optional AST manipulation func that, if provided, will be run
	// against the generated Go file prior to running it through goimports.
	Apply astutil.ApplyFunc

	// GenDirName returns the name of the parent directory in which the type file
	// should be generated. If nil, the DeclForGen.Lineage().Name() will be used.
	GenDirName func(*DeclForGen) string
}

type genGoTypes struct {
	gokindsdir string
	cfg        *GoTypesGeneratorConfig
}

var _ KindGenStep = &genGoTypes{}

func (gen *genGoTypes) Name() string {
	return "GoTypesGenerator"
}

func (gen *genGoTypes) Generate(decl *DeclForGen) (*GeneratedFile, error) {
	if decl.IsRaw() {
		return nil, nil
	}

	lin := decl.Lineage()
	sch := thema.SchemaP(lin, thema.LatestVersion(lin))
	pdir := gen.cfg.GenDirName(decl)
	// TODO allow using name instead of machine name in thema generator
	b, err := tgo.GenerateTypesOpenAPI(sch, &tgo.TypeConfigOpenAPI{
		PackageName: filepath.Base(pdir),
		Apply:       gen.cfg.Apply,
	})
	if err != nil {
		return nil, err
	}
	return &GeneratedFile{
		RelativePath: filepath.Join(gen.gokindsdir, pdir, lin.Name()+"_types_gen.go"),
		Data:         b,
	}, nil
}
