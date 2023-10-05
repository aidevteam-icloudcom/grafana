// +k8s:deepcopy-gen=package
// +k8s:openapi-gen=true
// +groupName=testing.grafana.io

// The testing api is a dependency free service that we can use to experiment with
// api aggregation across multiple deployment models.  Specifically:
//   - standalone: running as part of the standard grafana build
//   - aggregated: running as the target

package v0alpha1 // import "github.com/grafana/grafana/pkg/apis/testing/v0alpha1"
