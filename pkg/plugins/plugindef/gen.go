//go:build ignore
// +build ignore

package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"go/ast"
	"os"
	"path/filepath"
	"strings"

	"cuelang.org/go/cue/cuecontext"
	"github.com/grafana/codejen"
	"github.com/grafana/grafana/pkg/codegen"
	"github.com/grafana/grafana/pkg/cuectx"
	"github.com/grafana/thema"
	"github.com/grafana/thema/encoding/gocode"
	"github.com/grafana/thema/encoding/jsonschema"
	"golang.org/x/tools/go/ast/astutil"
)

var dirPlugindef = filepath.Join("pkg", "plugins", "plugindef")

// main generator for plugindef. plugindef isn't a kind, so it has its own
// one-off main generator.
func main() {
	v := elsedie(cuectx.BuildGrafanaInstance(nil, dirPlugindef, "", nil))("could not load plugindef cue package")

	lin := elsedie(thema.BindLineage(v, cuectx.GrafanaThemaRuntime()))("plugindef lineage is invalid")

	jl := &codejen.JennyList[thema.Lineage]{}
	jl.AppendOneToOne(&jennytypego{}, &jennybindgo{}, &jennyjschema{})
	jl.AddPostprocessors(codegen.SlashHeaderMapper(filepath.Join(dirPlugindef, "gen.go")))

	cwd, err := os.Getwd()
	if err != nil {
		fmt.Fprintf(os.Stderr, "could not get working directory: %s", err)
		os.Exit(1)
	}
	grootp := strings.Split(cwd, string(os.PathSeparator))
	groot := filepath.Join(string(os.PathSeparator), filepath.Join(grootp[:len(grootp)-3]...))

	jfs := elsedie(jl.GenerateFS([]thema.Lineage{lin}))("plugindef jenny pipeline failed")
	if _, set := os.LookupEnv("CODEGEN_VERIFY"); set {
		if err := jfs.Verify(context.Background(), groot); err != nil {
			die(fmt.Errorf("generated code is out of sync with inputs:\n%s\nrun `make gen-cue` to regenerate", err))
		}
	} else if err := jfs.Write(context.Background(), groot); err != nil {
		die(fmt.Errorf("error while writing generated code to disk:\n%s", err))
	}
}

// one-off jenny for plugindef go types
type jennytypego struct{}

func (j *jennytypego) JennyName() string {
	return "PluginGoTypes"
}

func (j *jennytypego) Generate(lin thema.Lineage) (*codejen.File, error) {
	b, err := gocode.GenerateTypesOpenAPI(lin.Latest(), &gocode.TypeConfigOpenAPI{
		ApplyFuncs: []astutil.ApplyFunc{
			codegen.PrefixReplacer("Plugindef", "PluginDef"),
		},
	})
	if err != nil {
		return nil, err
	}
	return codejen.NewFile("plugindef_types_gen.go", b, j), nil
}

// one-off jenny for plugindef go bindings
type jennybindgo struct{}

func (j *jennybindgo) JennyName() string {
	return "PluginGoBindings"
}

func (j *jennybindgo) Generate(lin thema.Lineage) (*codejen.File, error) {
	b, err := gocode.GenerateLineageBinding(lin, &gocode.BindingConfig{
		TitleName:      "PluginDef",
		Assignee:       ast.NewIdent("*PluginDef"),
		PrivateFactory: true,
	})
	if err != nil {
		return nil, err
	}
	return codejen.NewFile(filepath.Join(dirPlugindef, "plugindef_bindings_gen.go"), b, j), nil
}

// one-off jenny for plugindef json schema generator
type jennyjschema struct{}

func (j *jennyjschema) JennyName() string {
	return "PluginJSONSchema"
}

func (j *jennyjschema) Generate(lin thema.Lineage) (*codejen.File, error) {
	f, err := jsonschema.GenerateSchema(lin.Latest())
	if err != nil {
		return nil, err
	}

	b, _ := cuecontext.New().BuildFile(f).MarshalJSON()
	nb := new(bytes.Buffer)
	die(json.Indent(nb, b, "", "  "))
	return codejen.NewFile(filepath.FromSlash("docs/sources/developers/plugins/plugin.schema.json"), nb.Bytes(), j), nil
}

func elsedie[T any](t T, err error) func(msg string) T {
	if err != nil {
		return func(msg string) T {
			fmt.Fprintf(os.Stderr, "%s: %s\n", msg, err)
			os.Exit(1)
			return t
		}
	}
	return func(msg string) T {
		return t
	}
}

func die(err error) {
	if err != nil {
		fmt.Fprint(os.Stderr, err, "\n")
		os.Exit(1)
	}
}
