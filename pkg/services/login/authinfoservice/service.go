package authinfoservice

import (
	"context"
	"errors"

	"github.com/grafana/grafana/pkg/bus"
	"github.com/grafana/grafana/pkg/infra/log"
	"github.com/grafana/grafana/pkg/models"
	"github.com/grafana/grafana/pkg/services/login"
	"github.com/grafana/grafana/pkg/services/secrets"
	"github.com/grafana/grafana/pkg/services/sqlstore"
)

const genericOAuthModule = "oauth_generic_oauth"

type Implementation struct {
	Bus                   bus.Bus
	SQLStore              *sqlstore.SQLStore
	UserProtectionService login.UserProtectionService
	SecretsService        secrets.Service
	logger                log.Logger
}

func ProvideAuthInfoService(bus bus.Bus, store *sqlstore.SQLStore, userProtectionService login.UserProtectionService,
	secretsService secrets.Service) *Implementation {
	s := &Implementation{
		Bus:                   bus,
		SQLStore:              store,
		UserProtectionService: userProtectionService,
		SecretsService:        secretsService,
		logger:                log.New("login.authinfo"),
	}

	s.Bus.AddHandlerCtx(s.GetExternalUserInfoByLogin)
	s.Bus.AddHandler(s.GetAuthInfo)
	s.Bus.AddHandler(s.SetAuthInfo)
	s.Bus.AddHandler(s.UpdateAuthInfo)
	s.Bus.AddHandler(s.DeleteAuthInfo)

	return s
}

func (s *Implementation) getUserById(id int64) (bool, *models.User, error) {
	var (
		has bool
		err error
	)
	user := &models.User{}
	err = s.SQLStore.WithDbSession(context.Background(), func(sess *sqlstore.DBSession) error {
		has, err = sess.ID(id).Get(user)
		return err
	})
	if err != nil {
		return false, nil, err
	}

	return has, user, nil
}

func (s *Implementation) getUser(user *models.User) (bool, error) {
	var err error
	var has bool

	err = s.SQLStore.WithDbSession(context.Background(), func(sess *sqlstore.DBSession) error {
		has, err = sess.Get(user)
		return err
	})

	return has, err
}

func (s *Implementation) LookupAndFix(query *models.GetUserByAuthInfoQuery) (bool, *models.User, *models.UserAuth, error) {
	authQuery := &models.GetAuthInfoQuery{}

	// Try to find the user by auth module and id first
	if query.AuthModule != "" && query.AuthId != "" {
		authQuery.AuthModule = query.AuthModule
		authQuery.AuthId = query.AuthId

		err := s.GetAuthInfo(authQuery)
		if !errors.Is(err, models.ErrUserNotFound) {
			if err != nil {
				return false, nil, nil, err
			}

			// if user id was specified and doesn't match the user_auth entry, remove it
			if query.UserLookupParams.UserID != nil &&
				*query.UserLookupParams.UserID != 0 &&
				*query.UserLookupParams.UserID != authQuery.Result.UserId {
				if err := s.DeleteAuthInfo(&models.DeleteAuthInfoCommand{
					UserAuth: authQuery.Result,
				}); err != nil {
					s.logger.Error("Error removing user_auth entry", "error", err)
				}

				return false, nil, nil, models.ErrUserNotFound
			} else {
				has, user, err := s.getUserById(authQuery.Result.UserId)
				if err != nil {
					return false, nil, nil, err
				}

				if !has {
					// if the user has been deleted then remove the entry
					err = s.DeleteAuthInfo(&models.DeleteAuthInfoCommand{
						UserAuth: authQuery.Result,
					})
					if err != nil {
						s.logger.Error("Error removing user_auth entry", "error", err)
					}

					return false, nil, nil, models.ErrUserNotFound
				}

				return true, user, authQuery.Result, nil
			}
		}
	}

	return false, nil, nil, models.ErrUserNotFound
}

func (s *Implementation) LookupByOneOf(params *models.UserLookupParams) (*models.User, error) {
	var user *models.User
	var err error
	foundUser := false

	// If not found, try to find the user by id
	if params.UserID != nil && *params.UserID != 0 {
		foundUser, user, err = s.getUserById(*params.UserID)
		if err != nil {
			return nil, err
		}
	}

	// If not found, try to find the user by email address
	if !foundUser && params.Email != nil && *params.Email != "" {
		user = &models.User{Email: *params.Email}
		foundUser, err = s.getUser(user)
		if err != nil {
			return nil, err
		}
	}

	// If not found, try to find the user by login
	if !foundUser && params.Login != nil && *params.Login != "" {
		user = &models.User{Login: *params.Login}
		foundUser, err = s.getUser(user)
		if err != nil {
			return nil, err
		}
	}

	if !foundUser {
		return nil, models.ErrUserNotFound
	}

	return user, nil
}

func (s *Implementation) GenericOAuthLookup(authModule string, authId string, userID int64) (*models.UserAuth, error) {
	if authModule == genericOAuthModule && userID != 0 {
		authQuery := &models.GetAuthInfoQuery{}
		authQuery.AuthModule = authModule
		authQuery.AuthId = authId
		authQuery.UserId = userID
		err := s.GetAuthInfo(authQuery)
		if err != nil {
			return nil, err
		}

		return authQuery.Result, nil
	}
	return nil, nil
}

func (s *Implementation) LookupAndUpdate(query *models.GetUserByAuthInfoQuery) (*models.User, error) {
	// 1. LookupAndFix = auth info, user, error
	// TODO: Not a big fan of the fact that we are deleting auth info here, might want to move that
	foundUser, user, authInfo, err := s.LookupAndFix(query)
	if err != nil && !errors.Is(err, models.ErrUserNotFound) {
		return nil, err
	}

	// 2. FindByUserDetails
	if !foundUser {
		user, err = s.LookupByOneOf(&query.UserLookupParams)
		if err != nil {
			return nil, err
		}
	}

	if err := s.UserProtectionService.AllowUserMapping(user, query.AuthModule); err != nil {
		return nil, err
	}

	// Special case for generic oauth duplicates
	ai, err := s.GenericOAuthLookup(query.AuthModule, query.AuthId, user.Id)
	if !errors.Is(err, models.ErrUserNotFound) {
		if err != nil {
			return nil, err
		}
	}
	if ai != nil {
		authInfo = ai
	}

	if authInfo == nil && query.AuthModule != "" {
		cmd := &models.SetAuthInfoCommand{
			UserId:     user.Id,
			AuthModule: query.AuthModule,
			AuthId:     query.AuthId,
		}
		if err := s.SetAuthInfo(cmd); err != nil {
			return nil, err
		}
	}

	return user, nil
}
