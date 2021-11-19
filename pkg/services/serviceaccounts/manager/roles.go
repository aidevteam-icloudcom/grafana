package manager

import (
	"github.com/grafana/grafana/pkg/services/accesscontrol"
	"github.com/grafana/grafana/pkg/services/serviceaccounts"
)

var (
	role = accesscontrol.RoleRegistration{
		Role: accesscontrol.RoleDTO{
			Version:     3,
			Name:        "fixed:serviceaccounts:writer",
			DisplayName: "Service accounts writer",
			Description: "Create, update, delete, read, or query service accounts.",
			Group:       "Service accounts",
			Permissions: []accesscontrol.Permission{
				{
					Action: serviceaccounts.ActionDelete,
					Scope:  serviceaccounts.ScopeAll,
				},
			},
		},
		Grants: []string{"Admin"},
	}
)
