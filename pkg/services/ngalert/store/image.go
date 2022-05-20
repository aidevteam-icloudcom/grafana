package store

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/gofrs/uuid"

	"github.com/grafana/grafana/pkg/services/sqlstore"
)

var (
	// ErrImageNotFound is returned when the image does not exist.
	ErrImageNotFound = errors.New("image not found")
)

type Image struct {
	ID        int64     `xorm:"pk autoincr 'id'"`
	Token     string    `xorm:"token"`
	Path      string    `xorm:"path"`
	URL       string    `xorm:"url"`
	CreatedAt time.Time `xorm:"created_at"`
	ExpiresAt time.Time `xorm:"expires_at"`
}

// A XORM interface that lets us clean up our SQL session definition.
func (i *Image) TableName() string {
	return "alert_image"
}

type ImageStore interface {
	// Get returns the image with the token or ErrImageNotFound.
	GetImage(ctx context.Context, token string) (*Image, error)

	// Saves the image or returns an error.
	SaveImage(ctx context.Context, img *Image) error
}

func (st DBstore) GetImage(ctx context.Context, token string) (*Image, error) {
	var img Image
	if err := st.SQLStore.WithDbSession(ctx, func(sess *sqlstore.DBSession) error {
		exists, err := sess.Where("token = ?", token).Get(&img)
		if err != nil {
			return fmt.Errorf("failed to get image: %w", err)
		}
		if !exists {
			return ErrImageNotFound
		}
		return nil
	}); err != nil {
		return nil, err
	}
	return &img, nil
}

func (st DBstore) SaveImage(ctx context.Context, img *Image) error {
	return st.SQLStore.WithTransactionalDbSession(ctx, func(sess *sqlstore.DBSession) error {
		// TODO: Is this a good idea?
		img.ExpiresAt = TimeNow().Add(1 * time.Minute).UTC()
		if img.ID == 0 { // xorm will generate fill this field on Insert.
			token, err := uuid.NewV4()
			if err != nil {
				return fmt.Errorf("failed to create token: %w", err)
			}
			img.Token = token.String()
			img.CreatedAt = TimeNow().UTC()
			if _, err := sess.Insert(img); err != nil {
				return fmt.Errorf("failed to insert screenshot: %w", err)
			}
		} else {
			affected, err := sess.ID(img.ID).Update(img)
			if err != nil {
				return fmt.Errorf("failed to update screenshot: %v", err)
			}
			if affected == 0 {
				return fmt.Errorf("update statement had no effect")
			}
		}
		return nil
	})
}

//nolint:unused
func (st DBstore) DeleteExpiredImages(ctx context.Context) error {
	return st.SQLStore.WithTransactionalDbSession(ctx, func(sess *sqlstore.DBSession) error {
		n, err := sess.Where("expires_at < ?", TimeNow()).Delete(&Image{})
		if err != nil {
			return fmt.Errorf("failed to delete expired images: %w", err)
		}
		st.Logger.Info("deleted expired images", "n", n)
		return err
	})
}
