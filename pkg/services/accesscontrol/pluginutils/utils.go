package pluginutils

import (
	"fmt"
	"strings"

	"github.com/grafana/grafana/pkg/plugins"
	ac "github.com/grafana/grafana/pkg/services/accesscontrol"
	pluginac "github.com/grafana/grafana/pkg/services/pluginsintegration/pluginaccesscontrol"
)

var (
	// Core Actions that the plugins can use in their roles as long as the scope is suffixed with the plugin ID
	allowedCoreActions = map[string]string{
		pluginac.ActionAppAccess:    "plugins:id:",
		"folders:create":            "folders:uid:",
		"folders:read":              "folders:uid:",
		"folders:write":             "folders:uid:",
		"folders:delete":            "folders:uid:",
		"folders.permissions:read":  "folders:uid:",
		"folders.permissions:write": "folders:uid:",
	}
)

// ValidatePluginPermissions errors when a permission does not match expected pattern for plugins
func ValidatePluginPermissions(pluginID string, permissions []ac.Permission) error {
	for i := range permissions {
		scopePrefix, isCore := allowedCoreActions[permissions[i].Action]
		if isCore {
			if permissions[i].Scope != scopePrefix+pluginID {
				return &ac.ErrorScopeTarget{Action: permissions[i].Action, Scope: permissions[i].Scope,
					ExpectedScope: scopePrefix + pluginID}
			}
			// Prevent any unlikely injection
			permissions[i].Scope = scopePrefix + pluginID
			continue
		}
		if !strings.HasPrefix(permissions[i].Action, pluginID+":") &&
			!strings.HasPrefix(permissions[i].Action, pluginID+".") {
			return &ac.ErrorActionPrefixMissing{Action: permissions[i].Action,
				Prefixes: []string{pluginac.ActionAppAccess, pluginID + ":", pluginID + "."}}
		}
	}

	return nil
}

// ValidatePluginRole errors when a plugin role does not match expected pattern
// or doesn't have permissions matching the expected pattern.
func ValidatePluginRole(pluginID string, role ac.RoleDTO) error {
	if pluginID == "" {
		return ac.ErrPluginIDRequired
	}
	if role.DisplayName == "" {
		return &ac.ErrorRoleNameMissing{}
	}
	if !strings.HasPrefix(role.Name, ac.PluginRolePrefix+pluginID+":") {
		return &ac.ErrorRolePrefixMissing{Role: role.Name, Prefixes: []string{ac.PluginRolePrefix + pluginID + ":"}}
	}

	return ValidatePluginPermissions(pluginID, role.Permissions)
}

func ToRegistrations(pluginID, pluginName string, regs []plugins.RoleRegistration) []ac.RoleRegistration {
	res := make([]ac.RoleRegistration, 0, len(regs))
	for i := range regs {
		res = append(res, ac.RoleRegistration{
			Role: ac.RoleDTO{
				Version:     1,
				Name:        roleName(pluginID, regs[i].Role.Name),
				DisplayName: regs[i].Role.Name,
				Description: regs[i].Role.Description,
				Group:       pluginName,
				Permissions: toPermissions(regs[i].Role.Permissions),
				OrgID:       ac.GlobalOrgID,
			},
			Grants: regs[i].Grants,
		})
	}
	return res
}

// PluginIDFromName extracts the plugin ID from the role name
func PluginIDFromName(roleName string) string {
	if !strings.HasPrefix(roleName, ac.PluginRolePrefix) {
		return ""
	}

	pluginID := strings.Builder{}
	for _, c := range roleName[len(ac.PluginRolePrefix):] {
		if c == ':' {
			break
		}
		pluginID.WriteRune(c)
	}
	return pluginID.String()
}

func roleName(pluginID, roleName string) string {
	return fmt.Sprintf("%v%v:%v", ac.PluginRolePrefix, pluginID, strings.Replace(strings.ToLower(roleName), " ", "-", -1))
}

func toPermissions(perms []plugins.Permission) []ac.Permission {
	res := make([]ac.Permission, 0, len(perms))
	for i := range perms {
		res = append(res, ac.Permission{Action: perms[i].Action, Scope: perms[i].Scope})
	}
	return res
}
