package util

import (
	"math/rand"
	"regexp"
	"time"

	"github.com/google/uuid"
)

var uidrand = rand.New(rand.NewSource(time.Now().UnixNano()))
var alphaRunes = []rune("abcdefghijklmnopqrstuvwxyz")

// Legacy UID pattern
var validUIDPattern = regexp.MustCompile(`^[a-zA-Z0-9\-\_]*$`).MatchString

// IsValidShortUID checks if short unique identifier contains valid characters
// NOTE: future Grafana UIDs will need conform to https://github.com/kubernetes/apimachinery/blob/master/pkg/util/validation/validation.go#L43
func IsValidShortUID(uid string) bool {
	return validUIDPattern(uid)
}

// IsShortUIDTooLong checks if short unique identifier is too long
func IsShortUIDTooLong(uid string) bool {
	return len(uid) > 40
}

// GenerateShortUID will generate a UUID that can also be a k8s name
// it is gaurenteed to have a character as the first letter
// This will return a valid k8s name
func GenerateShortUID() string {
	uid, err := uuid.NewRandom()
	if err != nil {
		// This should never happen... but this seems better than a panic
		for i := range uid {
			uid[i] = byte(uidrand.Intn(254))
		}
	}
	uuid := uid.String()
	if rune(uuid[0]) < rune('a') {
		return string(alphaRunes[uidrand.Intn(len(alphaRunes))]) + uuid[1:]
	}
	return uuid
}
