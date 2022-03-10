package dashboards

import (
	"context"
	"strconv"
	"strings"

	ac "github.com/grafana/grafana/pkg/services/accesscontrol"
)

const (
	ActionFoldersCreate           = "folders:create"
	ActionFoldersRead             = "folders:read"
	ActionFoldersWrite            = "folders:write"
	ActionFoldersDelete           = "folders:delete"
	ActionFoldersPermissionsRead  = "folders.permissions:read"
	ActionFoldersPermissionsWrite = "folders.permissions:write"

	ScopeFoldersRoot = "folders"
)

var (
	ScopeFoldersAll      = ac.GetResourceAllScope(ScopeFoldersRoot)
	ScopeFoldersProvider = ac.NewScopeProvider(ScopeFoldersRoot)
)

// NewNameScopeResolver provides an AttributeScopeResolver that is able to convert a scope prefixed with "folders:name:" into an id based scope.
func NewNameScopeResolver(db Store) (string, ac.AttributeScopeResolveFunc) {
	prefix := ScopeFoldersProvider.GetResourceScopeName("")
	resolver := func(ctx context.Context, orgID int64, scope string) (string, error) {
		if !strings.HasPrefix(scope, prefix) {
			return "", ac.ErrInvalidScope
		}
		nsName := scope[len(prefix):]
		folder, err := db.GetFolderByTitle(orgID, nsName)
		if err != nil {
			return "", err
		}
		return ScopeFoldersProvider.GetResourceScope(strconv.FormatInt(folder.Id, 10)), nil
	}
	return prefix, resolver
}
