package userimpl

import (
	"context"
	"errors"
	"fmt"
	"net/mail"
	"time"

	"github.com/grafana/grafana/pkg/services/notifications"
	tempuser "github.com/grafana/grafana/pkg/services/temp_user"
	"github.com/grafana/grafana/pkg/services/user"
	"github.com/grafana/grafana/pkg/setting"
	"github.com/grafana/grafana/pkg/util"
	"github.com/grafana/grafana/pkg/util/errutil"
)

var (
	errInvalidCode = errutil.BadRequest("user.code.invalid")
	errExpiredCode = errutil.BadRequest("user.code.expired")
)

var _ user.Verifier = (*Verifier)(nil)

func ProvideVerifier(cfg *setting.Cfg, us user.Service, ts tempuser.Service, ns notifications.Service) *Verifier {
	return &Verifier{cfg, us, ts, ns}
}

type Verifier struct {
	cfg *setting.Cfg
	us  user.Service
	ts  tempuser.Service
	ns  notifications.Service
}

func (s *Verifier) Start(ctx context.Context, cmd user.StartVerifyEmailCommand) error {
	usr, err := s.us.GetByLogin(ctx, &user.GetUserByLoginQuery{
		LoginOrEmail: cmd.Email,
	})

	if err != nil && !errors.Is(err, user.ErrUserNotFound) {
		return err
	}

	// if email is already used by another user we stop here
	if usr != nil && usr.ID != cmd.User.ID {
		return user.ErrEmailConflict.Errorf("email already used")
	}

	code, err := util.GetRandomString(20)
	if err != nil {
		return fmt.Errorf("failed to generate verification code: %w", err)
	}

	// invalidate any pending verifications for user
	if err = s.ts.ExpirePreviousVerifications(
		ctx, &tempuser.ExpirePreviousVerificationsCommand{InvitedByUserID: cmd.User.ID},
	); err != nil {
		return fmt.Errorf("failed to expire previous verifications: %w", err)
	}

	tmpUsr, err := s.ts.CreateTempUser(ctx, &tempuser.CreateTempUserCommand{
		OrgID: -1,
		// used to determine if the user was updating their email or username in the second step of the verification flow
		Name: string(cmd.Action),
		// used to fetch the User in the second step of the verification flow
		InvitedByUserID: cmd.User.ID,
		Email:           cmd.Email,
		Code:            code,
		Status:          tempuser.TmpUserEmailUpdateStarted,
	})

	if err != nil {
		return fmt.Errorf("failed to generate temp user for email verification: %w", err)
	}

	if err := s.ns.SendVerificationEmail(ctx, &notifications.SendVerifyEmailCommand{
		User:  &cmd.User,
		Code:  tmpUsr.Code,
		Email: cmd.Email,
	}); err != nil {
		return fmt.Errorf("failed to send verification email: %w", err)
	}

	if err := s.ts.UpdateTempUserWithEmailSent(ctx, &tempuser.UpdateTempUserWithEmailSentCommand{
		Code: tmpUsr.Code,
	}); err != nil {
		return fmt.Errorf("failed to mark email as sent: %w", err)
	}

	return nil
}

func (s *Verifier) Complete(ctx context.Context, cmd user.CompleteEmailVerifyCommand) error {
	tmpUsr, err := s.ts.GetTempUserByCode(ctx, &tempuser.GetTempUserByCodeQuery{Code: cmd.Code})
	if err != nil {
		return errInvalidCode.Errorf("failed to verify code: %w", err)
	}

	if tmpUsr.Status != tempuser.TmpUserEmailUpdateStarted {
		return errInvalidCode.Errorf("wrong status for verification code: %s", tmpUsr.Status)
	}

	if !tmpUsr.EmailSent {
		return errInvalidCode.Errorf("email was not marked as sent")
	}

	if tmpUsr.EmailSentOn.Add(s.cfg.VerificationEmailMaxLifetime).Before(time.Now()) {
		return errExpiredCode.Errorf("verification code has expired")
	}

	usr, err := s.us.GetByID(ctx, &user.GetUserByIDQuery{ID: tmpUsr.InvitedByID})
	if err != nil {
		return err
	}

	verified := true
	update := &user.UpdateUserCommand{
		Email:         tmpUsr.Email,
		UserID:        tmpUsr.InvitedByID,
		EmailVerified: &verified,
	}
	switch tmpUsr.Name {
	case string(user.EmailUpdateAction):
		// User updated the email field
		if _, err := mail.ParseAddress(usr.Login); err == nil {
			// If username was also an email, we update it to keep it in sync with the email field
			update.Login = tmpUsr.Email
		}
	case string(user.LoginUpdateAction):
		// User updated the username field with a new email
		update.Login = tmpUsr.Email
	default:
		return errors.New("trying to update email on unknown field")
	}

	if err := s.us.Update(ctx, update); err != nil {
		return err
	}

	if err := s.ts.UpdateTempUserStatus(
		ctx,
		&tempuser.UpdateTempUserStatusCommand{Code: cmd.Code, Status: tempuser.TmpUserEmailUpdateCompleted},
	); err != nil {
		return err
	}

	return nil
}
