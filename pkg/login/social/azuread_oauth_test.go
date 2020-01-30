package social

import (
	"golang.org/x/oauth2"
	"gopkg.in/square/go-jose.v2"
	"gopkg.in/square/go-jose.v2/jwt"
	"net/http"
	"reflect"
	"testing"
	"time"
)

func TestSocialAzureAD_UserInfo(t *testing.T) {
	type fields struct {
		SocialBase     *SocialBase
		allowedDomains []string
		allowSignup    bool
	}
	type args struct {
		client *http.Client
	}

	tests := []struct {
		name    string
		fields  fields
		claims  *azureClaims
		args    args
		want    *BasicUserInfo
		wantErr bool
	}{
		{
			name: "Email in email claim",
			claims: &azureClaims{
				Email:      "me@example.com",
				UniqueName: "",
				Upn:        "",
				Roles:      []string{},
				Name:       "My Name",
				ID:         "1234",
			},
			want: &BasicUserInfo{
				Id:      "1234",
				Name:    "My Name",
				Email:   "me@example.com",
				Login:   "me@example.com",
				Company: "",
				Role:    "Viewer",
				Groups:  nil,
			},
		},
		{
			name: "No email",
			claims: &azureClaims{
				Email:      "",
				UniqueName: "",
				Upn:        "",
				Roles:      []string{},
				Name:       "My Name",
				ID:         "1234",
			},
			want:    nil,
			wantErr: true,
		},
		{
			name:    "No id token",
			claims:  nil,
			want:    nil,
			wantErr: true,
		},
		{
			name: "Email in unique_name claim",
			claims: &azureClaims{
				Email:      "",
				UniqueName: "me@example.com",
				Upn:        "",
				Roles:      []string{},
				Name:       "My Name",
				ID:         "1234",
			},
			want: &BasicUserInfo{
				Id:      "1234",
				Name:    "My Name",
				Email:   "me@example.com",
				Login:   "me@example.com",
				Company: "",
				Role:    "Viewer",
				Groups:  nil,
			},
		},
		{
			name: "Email in upn claim",
			claims: &azureClaims{
				Email:      "",
				UniqueName: "",
				Upn:        "me@example.com",
				Roles:      []string{},
				Name:       "My Name",
				ID:         "1234",
			},
			want: &BasicUserInfo{
				Id:      "1234",
				Name:    "My Name",
				Email:   "me@example.com",
				Login:   "me@example.com",
				Company: "",
				Role:    "Viewer",
				Groups:  nil,
			},
		},
		{
			name: "Admin role",
			claims: &azureClaims{
				Email:      "me@example.com",
				UniqueName: "",
				Upn:        "",
				Roles:      []string{"Admin"},
				Name:       "My Name",
				ID:         "1234",
			},
			want: &BasicUserInfo{
				Id:      "1234",
				Name:    "My Name",
				Email:   "me@example.com",
				Login:   "me@example.com",
				Company: "",
				Role:    "Admin",
				Groups:  nil,
			},
		},
		{
			name: "Lowercase Admin role",
			claims: &azureClaims{
				Email:      "me@example.com",
				UniqueName: "",
				Upn:        "",
				Roles:      []string{"admin"},
				Name:       "My Name",
				ID:         "1234",
			},
			want: &BasicUserInfo{
				Id:      "1234",
				Name:    "My Name",
				Email:   "me@example.com",
				Login:   "me@example.com",
				Company: "",
				Role:    "Admin",
				Groups:  nil,
			},
		},
		{
			name: "Only other roles",
			claims: &azureClaims{
				Email:      "me@example.com",
				UniqueName: "",
				Upn:        "",
				Roles:      []string{"AppAdmin"},
				Name:       "My Name",
				ID:         "1234",
			},
			want: &BasicUserInfo{
				Id:      "1234",
				Name:    "My Name",
				Email:   "me@example.com",
				Login:   "me@example.com",
				Company: "",
				Role:    "Viewer",
				Groups:  nil,
			},
		},

		{
			name: "Editor role",
			claims: &azureClaims{
				Email:      "me@example.com",
				UniqueName: "",
				Upn:        "",
				Roles:      []string{"Editor"},
				Name:       "My Name",
				ID:         "1234",
			},
			want: &BasicUserInfo{
				Id:      "1234",
				Name:    "My Name",
				Email:   "me@example.com",
				Login:   "me@example.com",
				Company: "",
				Role:    "Editor",
				Groups:  nil,
			},
		},
		{
			name: "Admin and Editor roles in claim",
			claims: &azureClaims{
				Email:      "me@example.com",
				UniqueName: "",
				Upn:        "",
				Roles:      []string{"Admin", "Editor"},
				Name:       "My Name",
				ID:         "1234",
			},
			want: &BasicUserInfo{
				Id:      "1234",
				Name:    "My Name",
				Email:   "me@example.com",
				Login:   "me@example.com",
				Company: "",
				Role:    "Admin",
				Groups:  nil,
			},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			s := &SocialAzureAD{
				SocialBase:     tt.fields.SocialBase,
				allowedDomains: tt.fields.allowedDomains,
				allowSignup:    tt.fields.allowSignup,
			}

			key := []byte("secret")
			sig, err := jose.NewSigner(jose.SigningKey{Algorithm: jose.HS256, Key: key}, (&jose.SignerOptions{}).WithType("JWT"))
			if err != nil {
				panic(err)
			}

			cl := jwt.Claims{
				Subject:   "subject",
				Issuer:    "issuer",
				NotBefore: jwt.NewNumericDate(time.Date(2016, 1, 1, 0, 0, 0, 0, time.UTC)),
				Audience:  jwt.Audience{"leela", "fry"},
			}

			var raw string
			if tt.claims != nil {
				raw, err = jwt.Signed(sig).Claims(cl).Claims(tt.claims).CompactSerialize()
				if err != nil {
					t.Error(err)
				}
			} else {
				raw, err = jwt.Signed(sig).Claims(cl).CompactSerialize()
				if err != nil {
					t.Error(err)
				}

			}

			token := &oauth2.Token{}
			if tt.claims != nil {
				token = token.WithExtra(map[string]interface{}{"id_token": raw})
			}

			got, err := s.UserInfo(tt.args.client, token)
			if (err != nil) != tt.wantErr {
				t.Errorf("UserInfo() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !reflect.DeepEqual(got, tt.want) {
				t.Errorf("UserInfo() got = %v, want %v", got, tt.want)
			}
		})
	}
}
