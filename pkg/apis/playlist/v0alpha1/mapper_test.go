package v0alpha1

import (
	"testing"

	"github.com/grafana/grafana/pkg/setting"
	"github.com/stretchr/testify/require"
)

func TestNamespaceMapper(t *testing.T) {
	tests := []struct {
		name     string
		cfg      string
		orgId    int64
		expected string
	}{
		{
			name:     "default namespace",
			orgId:    1,
			expected: "default",
		},
		{
			name:     "with org",
			orgId:    123,
			expected: "org-123",
		},
		{
			name:     "with stackId",
			cfg:      "abc",
			orgId:    123, // ignored
			expected: "stack-abc",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mapper := GetNamespaceMapper(&setting.Cfg{StackID: tt.cfg})
			require.Equal(t, tt.expected, mapper(tt.orgId))
		})
	}
}
