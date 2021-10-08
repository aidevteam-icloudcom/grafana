package ossencryption

import (
	"context"
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	"errors"
	"fmt"
	"io"

	"github.com/grafana/grafana/pkg/util"
	"golang.org/x/crypto/pbkdf2"
)

type Service struct{}

func ProvideService() *Service {
	return &Service{}
}

const saltLength = 8

func (s *Service) Decrypt(_ context.Context, payload []byte, secret string) ([]byte, error) {
	if len(payload) < saltLength {
		return nil, fmt.Errorf("unable to compute salt")
	}
	salt := payload[:saltLength]
	key, err := encryptionKeyToBytes(secret, string(salt))
	if err != nil {
		return nil, err
	}

	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, err
	}

	// The IV needs to be unique, but not secure. Therefore it's common to
	// include it at the beginning of the ciphertext.
	if len(payload) < aes.BlockSize {
		return nil, errors.New("payload too short")
	}
	iv := payload[saltLength : saltLength+aes.BlockSize]
	payload = payload[saltLength+aes.BlockSize:]
	payloadDst := make([]byte, len(payload))

	stream := cipher.NewCFBDecrypter(block, iv)

	// XORKeyStream can work in-place if the two arguments are the same.
	stream.XORKeyStream(payloadDst, payload)
	return payloadDst, nil
}

func (s *Service) Encrypt(_ context.Context, payload []byte, secret string) ([]byte, error) {
	salt, err := util.GetRandomString(saltLength)
	if err != nil {
		return nil, err
	}

	key, err := encryptionKeyToBytes(secret, salt)
	if err != nil {
		return nil, err
	}
	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, err
	}

	// The IV needs to be unique, but not secure. Therefore it's common to
	// include it at the beginning of the ciphertext.
	ciphertext := make([]byte, saltLength+aes.BlockSize+len(payload))
	copy(ciphertext[:saltLength], salt)
	iv := ciphertext[saltLength : saltLength+aes.BlockSize]
	if _, err := io.ReadFull(rand.Reader, iv); err != nil {
		return nil, err
	}

	stream := cipher.NewCFBEncrypter(block, iv)
	stream.XORKeyStream(ciphertext[saltLength+aes.BlockSize:], payload)

	return ciphertext, nil
}

func (s *Service) EncryptJsonData(ctx context.Context, kv map[string]string, secret string) (map[string][]byte, error) {
	encrypted := make(map[string][]byte)
	for key, value := range kv {
		encryptedData, err := s.Encrypt(ctx, []byte(value), secret)
		if err != nil {
			return nil, err
		}

		encrypted[key] = encryptedData
	}
	return encrypted, nil
}

func (s *Service) DecryptJsonData(ctx context.Context, sjd map[string][]byte, secret string) (map[string]string, error) {
	decrypted := make(map[string]string)
	for key, data := range sjd {
		decryptedData, err := s.Decrypt(ctx, data, secret)
		if err != nil {
			return nil, err
		}

		decrypted[key] = string(decryptedData)
	}
	return decrypted, nil
}

func (s *Service) GetDecryptedValue(ctx context.Context, sjd map[string][]byte, key, fallback, secret string) string {
	if value, ok := sjd[key]; ok {
		decryptedData, err := s.Decrypt(ctx, value, secret)
		if err != nil {
			return fallback
		}

		return string(decryptedData)
	}

	return fallback
}

// Key needs to be 32bytes
func encryptionKeyToBytes(secret, salt string) ([]byte, error) {
	return pbkdf2.Key([]byte(secret), []byte(salt), 10000, 32, sha256.New), nil
}
