package grpc

import (
	"github.com/grafana/grafana/pkg/setting"
)

type mode string

var (
	inProcessMode mode = "inproc"
	remoteMode    mode = "remote"
)

func (m mode) isValid() bool {
	switch m {
	case inProcessMode, remoteMode:
		return true
	}
	return false
}

type authCfg struct {
	// mode is the authentication mode.
	// inproc: authentication is done in-process => no need to go fetch keys from a remote server.
	// remote: authentication relies on a remote server
	mode mode

	// signingKeysURL is the URL to fetch the signing keys from.
	// This is only used in remote mode.
	// Ex: https://localhost:3000/api/signing-keys/keys
	signingKeysURL string

	// allowedAudiences is the list of allowed audiences.
	allowedAudiences []string
}

func readAuthConfig(cfg *setting.Cfg) (*authCfg, error) {
	section := cfg.SectionWithEnvOverrides("grpc_authentication")

	return &authCfg{
		signingKeysURL: section.Key("signing_keys_url").MustString(""),
	}, nil
}
