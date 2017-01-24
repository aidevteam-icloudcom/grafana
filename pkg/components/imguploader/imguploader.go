package imguploader

import (
	"fmt"
	"regexp"

	"github.com/grafana/grafana/pkg/setting"
)

type ImageUploader interface {
	Upload(path string) (string, error)
}

type NopImageUploader struct {
}

func (NopImageUploader) Upload(path string) (string, error) {
	return "", nil
}

func NewImageUploader() (ImageUploader, error) {

	switch setting.ImageUploadProvider {
	case "ceph":
		cephsec, err := setting.Cfg.GetSection("external_image_storage.ceph")
		if err != nil {
			return nil, err
		}

		bucket := cephsec.Key("bucket").MustString("")
		if bucket == "" {
			return nil, fmt.Errorf("Could not find ceph bucket configuration")
		}
		accessKey := cephsec.Key("access_key").MustString("")
		secretKey := cephsec.Key("secret_key").MustString("")

		region := cephsec.Key("region").MustString("us-east-1")
		endpoint := cephsec.Key("endpoint").MustString("")
		if endpoint == "" {
			return nil, fmt.Errorf("Could not find ceph endpoint configuration")
		}
		disableSsl := cephsec.Key("disable_ssl").MustBool(false)
		publicUrl := cephsec.Key("public_url").MustString("https://" + bucket + "." + endpoint)

		return NewS3Uploader(region, endpoint, publicUrl, bucket, "public-read", accessKey, secretKey, disableSsl), nil
	case "s3":
		s3sec, err := setting.Cfg.GetSection("external_image_storage.s3")
		if err != nil {
			return nil, err
		}

		bucket := s3sec.Key("bucket_url").MustString("")
		accessKey := s3sec.Key("access_key").MustString("")
		secretKey := s3sec.Key("secret_key").MustString("")

		region := ""
		rBucket := regexp.MustCompile(`https?:\/\/(.*)\.s3(-([^.]+))?\.amazonaws\.com\/?`)
		matches := rBucket.FindStringSubmatch(bucket)
		if len(matches) == 0 {
			return nil, fmt.Errorf("Could not find bucket setting for image.uploader.s3")
		} else {
			bucket = matches[1]
			if matches[3] != "" {
				region = matches[3]
			} else {
				region = "us-east-1"
			}
		}

		endpoint := ""
		disableSsl := false
		publicUrl := "https://" + bucket + ".s3.amazonaws.com"

		return NewS3Uploader(region, endpoint, publicUrl, bucket, "public-read", accessKey, secretKey, disableSsl), nil
	case "webdav":
		webdavSec, err := setting.Cfg.GetSection("external_image_storage.webdav")
		if err != nil {
			return nil, err
		}

		url := webdavSec.Key("url").String()
		if url == "" {
			return nil, fmt.Errorf("Could not find url key for image.uploader.webdav")
		}

		username := webdavSec.Key("username").String()
		password := webdavSec.Key("password").String()

		return NewWebdavImageUploader(url, username, password)
	}

	return NopImageUploader{}, nil
}
