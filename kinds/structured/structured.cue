package kind

import "github.com/grafana/grafana/pkg/framework/kind"

// In each child directory, the set of .cue files with 'package kind'
// must be an instance of kind.#CoreStructured - a declaration of a
// structured kind.
kind.#CoreStructured
