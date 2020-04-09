package sqlstore

import (
	"github.com/grafana/grafana/pkg/services/sqlstore/migrator"
	"github.com/grafana/grafana/pkg/services/sqlstore/permissions"
	"github.com/grafana/grafana/pkg/services/sqlstore/search"
	"strings"

	"github.com/grafana/grafana/pkg/models"
)

// SearchBuilder is a builder/object mother that builds a dashboard search query
type SearchBuilder struct {
	SqlBuilder

	dialect             migrator.Dialect
	tags                []string
	isStarred           bool
	limit               int64
	page                int64
	signedInUser        *models.SignedInUser
	whereDashboardIdsIn []int64
	whereTitle          string
	whereTypeFolder     bool
	whereTypeDash       bool
	whereFolderIds      []int64
	permission          models.PermissionType
	shadow              search.Builder
}

func NewSearchBuilder(signedInUser *models.SignedInUser, limit int64, page int64, permission models.PermissionType) *SearchBuilder {
	// Default to page 1
	if page < 1 {
		page = 1
	}

	// default limit
	if limit <= 0 {
		limit = 1000
	}

	searchBuilder := &SearchBuilder{
		signedInUser: signedInUser,
		limit:        limit,
		page:         page,
		permission:   permission,
		dialect:      dialect,
		shadow: search.Builder{
			Dialect: dialect,
			Filters: []interface{}{
				search.OrgFilter{OrgId: signedInUser.OrgId},
				search.TitleSorter{},
				permissions.DashboardPermissionFilter{
					OrgRole:         signedInUser.OrgRole,
					OrgId:           signedInUser.OrgId,
					Dialect:         dialect,
					UserId:          signedInUser.UserId,
					PermissionLevel: permission,
				},
			},
		},
	}

	return searchBuilder
}

func (sb *SearchBuilder) WithDialect(dialect migrator.Dialect) *SearchBuilder {
	sb.dialect = dialect
	return sb
}

func (sb *SearchBuilder) WithTags(tags []string) *SearchBuilder {
	if len(tags) > 0 {
		sb.tags = tags
		sb.shadow.Filters = append(sb.shadow.Filters, search.TagsFilter{Tags: tags})
	}

	return sb
}

func (sb *SearchBuilder) IsStarred() *SearchBuilder {
	sb.isStarred = true
	sb.shadow.Filters = append(sb.shadow.Filters, search.StarredFilter{UserId: sb.signedInUser.UserId})

	return sb
}

func (sb *SearchBuilder) WithDashboardIdsIn(ids []int64) *SearchBuilder {
	if len(ids) > 0 {
		sb.whereDashboardIdsIn = ids
	}
	sb.shadow.Filters = append(sb.shadow.Filters, search.DashboardFilter{IDs: ids})

	return sb
}

func (sb *SearchBuilder) WithTitle(title string) *SearchBuilder {
	sb.whereTitle = title
	sb.shadow.Filters = append(sb.shadow.Filters, search.TitleFilter{Dialect: sb.dialect, Title: title})

	return sb
}

func (sb *SearchBuilder) WithType(queryType string) *SearchBuilder {
	sb.shadow.Filters = append(sb.shadow.Filters, search.TypeFilter{Type: queryType, Dialect: sb.dialect})
	if len(queryType) > 0 && queryType == "dash-folder" {
		sb.whereTypeFolder = true
	}

	if len(queryType) > 0 && queryType == "dash-db" {
		sb.whereTypeDash = true
	}

	return sb
}

func (sb *SearchBuilder) WithFolderIds(folderIds []int64) *SearchBuilder {
	sb.whereFolderIds = folderIds
	sb.shadow.Filters = append(sb.shadow.Filters, search.FolderFilter{IDs: folderIds})
	return sb
}

// ToSql builds the sql and returns it as a string, together with the params.
func (sb *SearchBuilder) ToSql() (string, []interface{}) {
	sb.params = make([]interface{}, 0)

	sb.buildSelect()

	if len(sb.tags) > 0 {
		sb.buildTagQuery()
	} else {
		sb.buildMainQuery()
	}

	sb.sql.WriteString(`
		ORDER BY dashboard.id ` + sb.dialect.LimitOffset(sb.limit, (sb.page-1)*sb.limit) + `) as ids
		INNER JOIN dashboard on ids.id = dashboard.id
	`)

	sb.sql.WriteString(`
		LEFT OUTER JOIN dashboard folder on folder.id = dashboard.folder_id
		LEFT OUTER JOIN dashboard_tag on dashboard.id = dashboard_tag.dashboard_id`)

	sb.sql.WriteString(" ORDER BY dashboard.title ASC")
	return sb.sql.String(), sb.params
}

func (sb *SearchBuilder) ShadowSql() (string, []interface{}) {
	return sb.shadow.ToSql(sb.limit, sb.page)
}

func (sb *SearchBuilder) buildSelect() {
	sb.sql.WriteString(
		`SELECT
			dashboard.id,
			dashboard.uid,
			dashboard.title,
			dashboard.slug,
			dashboard_tag.term,
			dashboard.is_folder,
			dashboard.folder_id,
			folder.uid as folder_uid,
			folder.slug as folder_slug,
			folder.title as folder_title
		FROM `)
}

func (sb *SearchBuilder) buildTagQuery() {
	sb.sql.WriteString(
		`(
	SELECT
		dashboard.id FROM dashboard
		LEFT OUTER JOIN dashboard_tag ON dashboard_tag.dashboard_id = dashboard.id
	`)

	if sb.isStarred {
		sb.sql.WriteString(" INNER JOIN star on star.dashboard_id = dashboard.id")
	}

	sb.sql.WriteString(` WHERE dashboard_tag.term IN (?` + strings.Repeat(",?", len(sb.tags)-1) + `) AND `)
	for _, tag := range sb.tags {
		sb.params = append(sb.params, tag)
	}

	sb.buildSearchWhereClause()

	// this ends the inner select (tag filtered part)
	sb.sql.WriteString(` GROUP BY dashboard.id HAVING COUNT(dashboard.id) >= ? `)
	sb.params = append(sb.params, len(sb.tags))
}

func (sb *SearchBuilder) buildMainQuery() {
	sb.sql.WriteString(`( SELECT dashboard.id FROM dashboard `)

	if sb.isStarred {
		sb.sql.WriteString(" INNER JOIN star on star.dashboard_id = dashboard.id")
	}

	sb.sql.WriteString(` WHERE `)
	sb.buildSearchWhereClause()

}

func (sb *SearchBuilder) buildSearchWhereClause() {
	sb.sql.WriteString(` dashboard.org_id=?`)
	sb.params = append(sb.params, sb.signedInUser.OrgId)

	if sb.isStarred {
		sb.sql.WriteString(` AND star.user_id=?`)
		sb.params = append(sb.params, sb.signedInUser.UserId)
	}

	if len(sb.whereDashboardIdsIn) > 0 {
		sb.sql.WriteString(` AND dashboard.id IN (?` + strings.Repeat(",?", len(sb.whereDashboardIdsIn)-1) + `)`)
		for _, dashboardId := range sb.whereDashboardIdsIn {
			sb.params = append(sb.params, dashboardId)
		}
	}

	sb.writeDashboardPermissionFilter(sb.signedInUser, sb.permission)

	if len(sb.whereTitle) > 0 {
		sb.sql.WriteString(" AND dashboard.title " + sb.dialect.LikeStr() + " ?")
		sb.params = append(sb.params, "%"+sb.whereTitle+"%")
	}

	if sb.whereTypeFolder {
		sb.sql.WriteString(" AND dashboard.is_folder = " + sb.dialect.BooleanStr(true))
	}

	if sb.whereTypeDash {
		sb.sql.WriteString(" AND dashboard.is_folder = " + sb.dialect.BooleanStr(false))
	}

	if len(sb.whereFolderIds) > 0 {
		sb.sql.WriteString(` AND dashboard.folder_id IN (?` + strings.Repeat(",?", len(sb.whereFolderIds)-1) + `) `)
		for _, id := range sb.whereFolderIds {
			sb.params = append(sb.params, id)
		}
	}
}
