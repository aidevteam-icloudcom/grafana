// Code generated by Wire. DO NOT EDIT.

//go:generate go run -mod=mod github.com/google/wire/cmd/wire
//go:build !wireinject
// +build !wireinject

package main

// Injectors from wire.go:

func injectedMessage(t title, lines ...string) string {
	string2 := provideMessage(lines...)
	return string2
}
