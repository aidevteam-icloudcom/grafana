package api

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"crypto/tls"
	"crypto/x509"
	"encoding/base64"
	"encoding/hex"
	"fmt"
	"io/ioutil"
	"net/http"
	"net/url"

	"golang.org/x/oauth2"

	"github.com/grafana/grafana/pkg/bus"
	"github.com/grafana/grafana/pkg/infra/log"
	"github.com/grafana/grafana/pkg/infra/metrics"
	"github.com/grafana/grafana/pkg/login"
	"github.com/grafana/grafana/pkg/login/social"
	"github.com/grafana/grafana/pkg/middleware"
	"github.com/grafana/grafana/pkg/models"
	"github.com/grafana/grafana/pkg/setting"
)

var (
	oauthLogger          = log.New("oauth")
	OauthStateCookieName = "oauth_state"
)

func GenStateString() (string, error) {
	rnd := make([]byte, 32)
	if _, err := rand.Read(rnd); err != nil {
		oauthLogger.Error("failed to generate state string", "err", err)
		return "", err
	}
	return base64.URLEncoding.EncodeToString(rnd), nil
}

func (hs *HTTPServer) OAuthLogin(ctx *models.ReqContext) {
	if setting.OAuthService == nil {
		ctx.Handle(404, "OAuth not enabled", nil)
		return
	}

	name := ctx.Params(":name")
	connect, ok := social.SocialMap[name]
	if !ok {
		ctx.Handle(404, fmt.Sprintf("No OAuth with name %s configured", name), nil)
		return
	}

	errorParam := ctx.Query("error")
	if errorParam != "" {
		errorDesc := ctx.Query("error_description")
		oauthLogger.Error("failed to login ", "error", errorParam, "errorDesc", errorDesc)
		hs.redirectWithError(ctx, login.ErrProviderDeniedRequest, "error", errorParam, "errorDesc", errorDesc)
		return
	}

	code := ctx.Query("code")
	if code == "" {
		state, err := GenStateString()
		if err != nil {
			ctx.Logger.Error("Generating state string failed", "err", err)
			ctx.Handle(500, "An internal error occurred", nil)
			return
		}

		hashedState := hashStatecode(state, setting.OAuthService.OAuthInfos[name].ClientSecret)
		middleware.WriteCookie(ctx.Resp, OauthStateCookieName, hashedState, hs.Cfg.OAuthCookieMaxAge, hs.CookieOptionsFromCfg)
		if setting.OAuthService.OAuthInfos[name].HostedDomain == "" {
			ctx.Redirect(connect.AuthCodeURL(state, oauth2.AccessTypeOnline))
		} else {
			ctx.Redirect(connect.AuthCodeURL(state, oauth2.SetAuthURLParam("hd", setting.OAuthService.OAuthInfos[name].HostedDomain), oauth2.AccessTypeOnline))
		}
		return
	}

	cookieState := ctx.GetCookie(OauthStateCookieName)

	// delete cookie
	middleware.DeleteCookie(ctx.Resp, OauthStateCookieName, hs.CookieOptionsFromCfg)

	if cookieState == "" {
		ctx.Handle(500, "login.OAuthLogin(missing saved state)", nil)
		return
	}

	queryState := hashStatecode(ctx.Query("state"), setting.OAuthService.OAuthInfos[name].ClientSecret)
	oauthLogger.Info("state check", "queryState", queryState, "cookieState", cookieState)
	if cookieState != queryState {
		ctx.Handle(500, "login.OAuthLogin(state mismatch)", nil)
		return
	}

	// handle callback
	tr := &http.Transport{
		Proxy: http.ProxyFromEnvironment,
		TLSClientConfig: &tls.Config{
			InsecureSkipVerify: setting.OAuthService.OAuthInfos[name].TlsSkipVerify,
		},
	}
	oauthClient := &http.Client{
		Transport: tr,
	}

	if setting.OAuthService.OAuthInfos[name].TlsClientCert != "" || setting.OAuthService.OAuthInfos[name].TlsClientKey != "" {
		cert, err := tls.LoadX509KeyPair(setting.OAuthService.OAuthInfos[name].TlsClientCert, setting.OAuthService.OAuthInfos[name].TlsClientKey)
		if err != nil {
			ctx.Logger.Error("Failed to setup TlsClientCert", "oauth", name, "error", err)
			ctx.Handle(500, "login.OAuthLogin(Failed to setup TlsClientCert)", nil)
			return
		}

		tr.TLSClientConfig.Certificates = append(tr.TLSClientConfig.Certificates, cert)
	}

	if setting.OAuthService.OAuthInfos[name].TlsClientCa != "" {
		caCert, err := ioutil.ReadFile(setting.OAuthService.OAuthInfos[name].TlsClientCa)
		if err != nil {
			ctx.Logger.Error("Failed to setup TlsClientCa", "oauth", name, "error", err)
			ctx.Handle(500, "login.OAuthLogin(Failed to setup TlsClientCa)", nil)
			return
		}

		caCertPool := x509.NewCertPool()
		caCertPool.AppendCertsFromPEM(caCert)

		tr.TLSClientConfig.RootCAs = caCertPool
	}

	oauthCtx := context.WithValue(context.Background(), oauth2.HTTPClient, oauthClient)

	// get token from provider
	token, err := connect.Exchange(oauthCtx, code)
	if err != nil {
		ctx.Handle(500, "login.OAuthLogin(NewTransportWithCode)", err)
		return
	}
	// token.TokenType was defaulting to "bearer", which is out of spec, so we explicitly set to "Bearer"
	token.TokenType = "Bearer"

	oauthLogger.Debug("OAuthLogin Got token", "token", token)

	// set up oauth2 client
	client := connect.Client(oauthCtx, token)

	// get user info
	userInfo, err := connect.UserInfo(client, token)
	if err != nil {
		if sErr, ok := err.(*social.Error); ok {
			hs.redirectWithError(ctx, sErr)
		} else {
			ctx.Handle(500, fmt.Sprintf("login.OAuthLogin(get info from %s)", name), err)
		}
		return
	}

	oauthLogger.Debug("OAuthLogin got user info", "userInfo", userInfo)

	// validate that we got at least an email address
	if userInfo.Email == "" {
		hs.redirectWithError(ctx, login.ErrNoEmail)
		return
	}

	// validate that the email is allowed to login to grafana
	if !connect.IsEmailAllowed(userInfo.Email) {
		hs.redirectWithError(ctx, login.ErrEmailNotAllowed)
		return
	}

	user, err := syncUser(ctx, token, userInfo, name, connect)
	if err != nil {
		hs.redirectWithError(ctx, err)
		return
	}

	// login
	if err := hs.loginUserWithUser(user, ctx); err != nil {
		hs.redirectWithError(ctx, err)
		return
	}

	metrics.MApiLoginOAuth.Inc()

	if redirectTo, err := url.QueryUnescape(ctx.GetCookie("redirect_to")); err == nil && len(redirectTo) > 0 {
		if err := hs.ValidateRedirectTo(redirectTo); err == nil {
			middleware.DeleteCookie(ctx.Resp, "redirect_to", hs.CookieOptionsFromCfg)
			ctx.Redirect(redirectTo)
			return
		}
		log.Debugf("Ignored invalid redirect_to cookie value: %v", redirectTo)
	}

	ctx.Redirect(setting.AppSubUrl + "/")
}

// syncUser syncs a Grafana user profile with the corresponding OAuth profile.
func syncUser(ctx *models.ReqContext, token *oauth2.Token, userInfo *social.BasicUserInfo, name string,
	connect social.SocialConnector) (*models.User, error) {
	oauthLogger.Debug("Syncing Grafana user with corresponding OAuth profile")
	extUser := &models.ExternalUserInfo{
		AuthModule: fmt.Sprintf("oauth_%s", name),
		OAuthToken: token,
		AuthId:     userInfo.Id,
		Name:       userInfo.Name,
		Login:      userInfo.Login,
		Email:      userInfo.Email,
		OrgRoles:   map[int64]models.RoleType{},
		Groups:     userInfo.Groups,
	}

	if userInfo.Role != "" {
		rt := models.RoleType(userInfo.Role)
		if rt.IsValid() {
			// The user will be assigned a role in either the auto-assigned organization or in the default one
			var orgID int64
			if setting.AutoAssignOrg && setting.AutoAssignOrgId > 0 {
				orgID = int64(setting.AutoAssignOrgId)
				logger.Debug("The user has a role assignment and organization membership is auto-assigned",
					"role", userInfo.Role, "orgId", orgID)
			} else {
				orgID = int64(1)
				logger.Debug("The user has a role assignment and organization membership is not auto-assigned",
					"role", userInfo.Role, "orgId", orgID)
			}
			extUser.OrgRoles[orgID] = rt
		}
	}

	// add/update user in Grafana
	cmd := &models.UpsertUserCommand{
		ReqContext:    ctx,
		ExternalUser:  extUser,
		SignupAllowed: connect.IsSignupAllowed(),
	}
	if err := bus.Dispatch(cmd); err != nil {
		return nil, err
	}

	// Do not expose disabled status,
	// just show incorrect user credentials error (see #17947)
	if cmd.Result.IsDisabled {
		oauthLogger.Warn("User is disabled", "user", cmd.Result.Login)
		return nil, login.ErrInvalidCredentials
	}

	return cmd.Result, nil
}

func hashStatecode(code, seed string) string {
	hashBytes := sha256.Sum256([]byte(code + setting.SecretKey + seed))
	return hex.EncodeToString(hashBytes[:])
}
