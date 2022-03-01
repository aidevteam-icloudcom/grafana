package database

//nolint:goimports
import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/grafana/grafana/pkg/infra/log"
	"github.com/grafana/grafana/pkg/models"
	"github.com/grafana/grafana/pkg/services/accesscontrol"
	"github.com/grafana/grafana/pkg/services/featuremgmt"
	"github.com/grafana/grafana/pkg/services/serviceaccounts"
	"github.com/grafana/grafana/pkg/services/sqlstore"
	"xorm.io/xorm"
)

type ServiceAccountsStoreImpl struct {
	sqlStore *sqlstore.SQLStore
	log      log.Logger
}

func NewServiceAccountsStore(store *sqlstore.SQLStore) *ServiceAccountsStoreImpl {
	return &ServiceAccountsStoreImpl{
		sqlStore: store,
	}
}

func (s *ServiceAccountsStoreImpl) CreateServiceAccount(ctx context.Context, sa *serviceaccounts.CreateServiceAccountForm) (saDTO *serviceaccounts.ServiceAccountDTO, err error) {
	// create a new service account - "user" with empty permissions
	generatedLogin := "Service-Account-" + uuid.New().String()
	cmd := models.CreateUserCommand{
		Login:            generatedLogin,
		Name:             sa.Name,
		OrgId:            sa.OrgID,
		IsServiceAccount: true,
	}
	newuser, err := s.sqlStore.CreateUser(ctx, cmd)
	if err != nil {
		return nil, fmt.Errorf("failed to create user: %v", err)
	}
	return &serviceaccounts.ServiceAccountDTO{
		Id:     newuser.Id,
		Name:   newuser.Name,
		Login:  newuser.Login,
		OrgId:  newuser.OrgId,
		Tokens: 0,
	}, nil
}

func (s *ServiceAccountsStoreImpl) DeleteServiceAccount(ctx context.Context, orgID, serviceaccountID int64) error {
	return s.sqlStore.WithTransactionalDbSession(ctx, func(sess *sqlstore.DBSession) error {
		return deleteServiceAccountInTransaction(sess, orgID, serviceaccountID)
	})
}

func deleteServiceAccountInTransaction(sess *sqlstore.DBSession, orgID, serviceAccountID int64) error {
	user := models.User{}
	has, err := sess.Where(`org_id = ? and id = ? and is_service_account = true`, orgID, serviceAccountID).Get(&user)
	if err != nil {
		return err
	}
	if !has {
		return serviceaccounts.ErrServiceAccountNotFound
	}
	for _, sql := range sqlstore.ServiceAccountDeletions() {
		_, err := sess.Exec(sql, user.Id)
		if err != nil {
			return err
		}
	}
	return nil
}

func (s *ServiceAccountsStoreImpl) UpgradeServiceAccounts(ctx context.Context) error {
	basicKeys := s.sqlStore.GetNonServiceAccountAPIKeys(ctx)
	if len(basicKeys) > 0 {
		s.log.Info("Launching background thread to upgrade API keys to service accounts", "numberKeys", len(basicKeys))
		go func() {
			for _, key := range basicKeys {
				err := s.CreateServiceAccountFromApikey(ctx, key)
				if err != nil {
					s.log.Error("migating to service accounts failed with error", err)
				}
			}
		}()
	}
	return nil
}

func (s *ServiceAccountsStoreImpl) ConvertToServiceAccounts(ctx context.Context, keys []int64) error {
	basicKeys := s.sqlStore.GetNonServiceAccountAPIKeys(ctx)
	if len(basicKeys) == 0 {
		return nil
	}
	if len(basicKeys) != len(keys) {
		return fmt.Errorf("one of the keys already has a serviceaccount")
	}
	for _, key := range basicKeys {
		if !contains(keys, key.Id) {
			s.log.Error("convert service accounts stopped for keyId %d as it is not part of the query to convert or already has a service account", key.Id)
			continue
		}
		err := s.CreateServiceAccountFromApikey(ctx, key)
		if err != nil {
			s.log.Error("converting to service accounts failed with error", err)
		}
	}
	return nil
}

func (s *ServiceAccountsStoreImpl) CreateServiceAccountFromApikey(ctx context.Context, key *models.ApiKey) error {
	sa, err := s.sqlStore.CreateServiceAccountForApikey(ctx, key.OrgId, key.Name, key.Role)
	if err != nil {
		return fmt.Errorf("failed to create service account for API key with error : %w", err)
	}

	err = s.sqlStore.UpdateApikeyServiceAccount(ctx, key.Id, sa.Id)
	if err != nil {
		return fmt.Errorf("failed to attach new service account to API key for keyId: %d and newServiceAccountId: %d with error: %w", key.Id, sa.Id, err)
	}
	s.log.Debug("Updated basic api key", "keyId", key.Id, "newServiceAccountId", sa.Id)
	return nil
}

//nolint:gosimple
func (s *ServiceAccountsStoreImpl) ListTokens(ctx context.Context, orgID int64, serviceAccountID int64) ([]*models.ApiKey, error) {
	result := make([]*models.ApiKey, 0)
	err := s.sqlStore.WithDbSession(ctx, func(dbSession *sqlstore.DBSession) error {
		var sess *xorm.Session

		sess = dbSession.
			Join("inner", "user", "user.id = api_key.service_account_id").
			Where("user.org_id=? AND user.id=?", orgID, serviceAccountID).
			Asc("name")

		return sess.Find(&result)
	})
	return result, err
}

func (s *ServiceAccountsStoreImpl) ListServiceAccounts(ctx context.Context, orgID, serviceAccountID int64) ([]*serviceaccounts.ServiceAccountDTO, error) {
	query := models.GetOrgUsersQuery{OrgId: orgID, IsServiceAccount: true}
	if serviceAccountID > 0 {
		query.UserID = serviceAccountID
	}

	if err := s.sqlStore.GetOrgUsers(ctx, &query); err != nil {
		return nil, err
	}

	saDTOs := make([]*serviceaccounts.ServiceAccountDTO, len(query.Result))
	for i, user := range query.Result {
		saDTOs[i] = &serviceaccounts.ServiceAccountDTO{
			Id:    user.UserId,
			OrgId: user.OrgId,
			Name:  user.Name,
			Login: user.Login,
			Role:  user.Role,
		}
		tokens, err := s.ListTokens(ctx, user.OrgId, user.UserId)
		if err != nil {
			return nil, err
		}
		saDTOs[i].Tokens = int64(len(tokens))
	}

	return saDTOs, nil
}

// RetrieveServiceAccountByID returns a service account by its ID
func (s *ServiceAccountsStoreImpl) RetrieveServiceAccount(ctx context.Context, orgID, serviceAccountID int64) (*serviceaccounts.ServiceAccountProfileDTO, error) {
	query := models.GetOrgUsersQuery{UserID: serviceAccountID, OrgId: orgID, IsServiceAccount: true}
	err := s.sqlStore.GetOrgUsers(ctx, &query)
	if err != nil {
		return nil, err
	}
	if len(query.Result) != 1 {
		return nil, serviceaccounts.ErrServiceAccountNotFound
	}

	// Get Teams of service account. Can be optimized by combining with the query above
	// in refactor
	getTeamQuery := models.GetTeamsByUserQuery{UserId: serviceAccountID, OrgId: orgID}
	if err := s.sqlStore.GetTeamsByUser(ctx, &getTeamQuery); err != nil {
		return nil, err
	}
	teams := make([]string, len(getTeamQuery.Result))

	for i := range getTeamQuery.Result {
		teams[i] = getTeamQuery.Result[i].Name
	}

	saProfile := &serviceaccounts.ServiceAccountProfileDTO{
		Id:        query.Result[0].UserId,
		Name:      query.Result[0].Name,
		Login:     query.Result[0].Login,
		OrgId:     query.Result[0].OrgId,
		UpdatedAt: query.Result[0].Updated,
		CreatedAt: query.Result[0].Created,
		Role:      query.Result[0].Role,
		Teams:     teams,
	}
	return saProfile, nil
}

func (s *ServiceAccountsStoreImpl) UpdateServiceAccount(ctx context.Context,
	orgID, serviceAccountID int64,
	saForm *serviceaccounts.UpdateServiceAccountForm) (*serviceaccounts.ServiceAccountDTO, error) {
	updatedUser := &models.OrgUserDTO{}

	err := s.sqlStore.WithTransactionalDbSession(ctx, func(sess *sqlstore.DBSession) error {
		query := models.GetOrgUsersQuery{UserID: serviceAccountID, OrgId: orgID, IsServiceAccount: true}
		if err := s.sqlStore.GetOrgUsers(ctx, &query); err != nil {
			return err
		}
		if len(query.Result) != 1 {
			return serviceaccounts.ErrServiceAccountNotFound
		}

		updatedUser = query.Result[0]

		if saForm.Name == nil && saForm.Role == nil {
			return nil
		}

		updateTime := time.Now()
		if saForm.Role != nil {
			var orgUser models.OrgUser
			orgUser.Role = *saForm.Role
			orgUser.Updated = updateTime

			if _, err := sess.ID(orgUser.Id).Update(&orgUser); err != nil {
				return err
			}

			updatedUser.Role = string(*saForm.Role)
		}

		if saForm.Name != nil {
			user := models.User{
				Name:    *saForm.Name,
				Updated: updateTime,
			}

			if _, err := sess.ID(serviceAccountID).Update(&user); err != nil {
				return err
			}

			updatedUser.Name = *saForm.Name
		}

		return nil
	})

	return &serviceaccounts.ServiceAccountDTO{
		Id:    updatedUser.UserId,
		Name:  updatedUser.Name,
		Login: updatedUser.Login,
		Role:  updatedUser.Role,
		OrgId: updatedUser.OrgId,
	}, err
}

// func (s *ServiceAccountsStoreImpl) SearchOrgServiceAccounts(ctx context.Context, query *models.SearchOrgUsersQuery) ([]*serviceaccounts.ServiceAccountDTO, error) {
// 	// force that it is service accounts that we query
// 	query.IsServiceAccount = true

// 	// translate between users and serviceaccountsDTO
// 	err := s.sqlStore.SearchOrgUsers(ctx, query)
// 	if err != nil {
// 		return nil, err
// 	}
// 	result := make([]*serviceaccounts.ServiceAccountDTO, 0, len(query.Result.OrgUsers))
// 	for _, user := range query.Result.OrgUsers {
// 		sa := &serviceaccounts.ServiceAccountDTO{
// 			Id:    user.UserId,
// 			Name:  user.Name,
// 			Login: user.Login,
// 			Role:  user.Role,
// 			OrgId: user.OrgId,
// 		}
// 		tokens, err := s.ListTokens(ctx, user.OrgId, user.UserId)
// 		if err != nil {
// 			return nil, err
// 		}
// 		sa.Tokens = int64(len(tokens))

// 		result = append(result, sa)
// 	}
// 	return result, nil
// }

func (s *ServiceAccountsStoreImpl) SearchOrgServiceAccounts(ctx context.Context, query *models.SearchOrgUsersQuery) ([]*serviceaccounts.ServiceAccountDTO, error) {
	query.IsServiceAccount = true

	serviceAccounts := make([]*serviceaccounts.ServiceAccountDTO, 0)

	err := s.sqlStore.WithDbSession(ctx, func(dbSession *sqlstore.DBSession) error {
		sess := dbSession.Table("org_user")
		sess.Join("INNER", s.sqlStore.Dialect.Quote("user"), fmt.Sprintf("org_user.user_id=%s.id", s.sqlStore.Dialect.Quote("user")))

		whereConditions := make([]string, 0)
		whereParams := make([]interface{}, 0)

		whereConditions = append(whereConditions, "org_user.org_id = ?")
		whereParams = append(whereParams, query.OrgID)

		// TODO: add to chore, for cleaning up after we have created
		// service accounts table in the modelling
		whereConditions = append(whereConditions, fmt.Sprintf("%s.is_service_account = %t", s.sqlStore.Dialect.Quote("user"), query.IsServiceAccount))

		if s.sqlStore.Cfg.IsFeatureToggleEnabled(featuremgmt.FlagAccesscontrol) {
			acFilter, err := accesscontrol.Filter(ctx, "org_user.user_id", "users", "serviceaccounts:read", query.User)
			if err != nil {
				return err
			}
			whereConditions = append(whereConditions, acFilter.Where)
			whereParams = append(whereParams, acFilter.Args...)
		}

		if query.Query != "" {
			queryWithWildcards := "%" + query.Query + "%"
			whereConditions = append(whereConditions, "(email "+s.sqlStore.Dialect.LikeStr()+" ? OR name "+s.sqlStore.Dialect.LikeStr()+" ? OR login "+s.sqlStore.Dialect.LikeStr()+" ?)")
			whereParams = append(whereParams, queryWithWildcards, queryWithWildcards, queryWithWildcards)
		}

		if len(whereConditions) > 0 {
			sess.Where(strings.Join(whereConditions, " AND "), whereParams...)
		}
		if query.Limit > 0 {
			offset := query.Limit * (query.Page - 1)
			sess.Limit(query.Limit, offset)
		}

		sess.Cols(
			"org_user.org_id",
			"org_user.user_id",
			"user.email",
			"user.name",
			"user.login",
			"org_user.role",
			"user.last_seen_at",
		)
		sess.Asc("user.email", "user.login")

		if err := sess.Find(&serviceAccounts); err != nil {
			return err
		}
		return nil
	})
	if err != nil {
		return nil, err
	}

	result := make([]*serviceaccounts.ServiceAccountDTO, 0, len(query.Result.OrgUsers))
	for _, sa := range serviceAccounts {
		tokens, err := s.ListTokens(ctx, sa.OrgId, sa.Id)
		if err != nil {
			return nil, err
		}
		sa.Tokens = int64(len(tokens))
		result = append(result, sa)
	}

	return result, nil
}

func contains(s []int64, e int64) bool {
	for _, a := range s {
		if a == e {
			return true
		}
	}
	return false
}
