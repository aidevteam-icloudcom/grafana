// Copyright 2022 Grafana Labs
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// This file is autogenerated. DO NOT EDIT.
//
// Generated by public/app/plugins/gen.go
//
// Run `make gen-cue` from repository root to regenerate.

package postgres

import (
	"embed"
	"fmt"
	"sync"

	"github.com/grafana/grafana/pkg/cuectx"
	"github.com/grafana/grafana/pkg/plugins/pfs"
	"github.com/grafana/thema"
)

var parseOnce sync.Once
var ptree *pfs.Tree

//go:embed plugin.json
var plugFS embed.FS

// PluginTree returns the plugin tree representing the statically analyzable contents of the postgres plugin.
func PluginTree(lib *thema.Library) *pfs.Tree {
	var err error
	if lib == nil {
		parseOnce.Do(func() {
			ptree, err = pfs.ParsePluginFS(plugFS, cuectx.ProvideThemaLibrary())
		})
	} else {
		ptree, err = pfs.ParsePluginFS(plugFS, cuectx.ProvideThemaLibrary())
	}

	if err != nil {
		// Even the most rudimentary testing in CI ensures this is unreachable
		panic(fmt.Errorf("error parsing plugin fs tree: %w", err))
	}

	return ptree
}
