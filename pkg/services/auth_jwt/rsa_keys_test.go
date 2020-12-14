package auth_jwt

import (
	"crypto/rsa"
	"crypto/x509"
	"encoding/pem"
	"fmt"

	jose "gopkg.in/square/go-jose.v2"
)

var rsaKeys [3]*rsa.PrivateKey
var jwKeys [3]jose.JSONWebKey
var jwksPublic jose.JSONWebKeySet

const rsaKeysPEM = `
-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA0vKKKQzRHxtnvgvScOvZW2lIBiZ0YBN8ZwAfQdpEQy2w7qAT
WVCr/N/Tj6971gzbwqHL+VIw67SA0o2Ofb/96j2OXsS0mEo/8d2Q3rtOmzAobRBD
fkfVQW3TsbT8Lm+nM9PJkg8+5ZdTYt4ABQRNPFj7jei+udb6mo3aJIFK108K5+gi
gDsgoBS9iZ2CsSymUXd3Sb+WuLx6Cgzx7hjQvsNG4MnQDo1DOFQ+soQqKVRpzH9C
CI574y0fN6TZbi9HehZxgdJgPEiJ9xRuO5pP74fcxEQIcI7lCmBk+t/c3jr4f7Zp
ubLQofvfmF7zSMDveFsh7f80T0SW4/ll4pOJjwIDAQABAoIBAAWiAFp0QylHfA+x
FR96zMUKHKg9YqImIw5FDJCfmW8Jy02z7JBX/R+1glq13uKqWTvrQh0YOsIwgbgd
m450D/2vQxv4uLHQWcDFn9ayvbibIpk28/ZtSJ6EpkB6irlateZGY32I9q7+yXU8
ZFe986oG3kC91En2GZ8C5q5O3Ya+Qyf/uT533cB4u3kMfsBzF38axJgw/z1tW3OJ
XaJHrcYb8yBS0nlrfDQeEvE3JxwtFrtz+oPZ3uqNyUX7Ti0s3HTzG0xs+ctg7Wm9
fRaogbU6wiDMj74ixszdZ7bdgwuETPw85XIcelrlNnCUDCDjmiA83XaxL+0yhOlx
Nb4F2fECgYEA9gK7zaswBsXk9BA73rWbDmO5cJU1dYAkZnWW4kIwjQoccTXAH02l
tvQ9bEyhxp8xf5+H/OLuR8Pc0sP7FCu/UojaQ+4js3DKC5tccMWAmxDrqySilXqU
P3uENNXVp4EyQ2BJQ/t3vuuXxXaAg9FnilK/MZDxdoG9lLQpzHq4BVMCgYEA24NT
WqfTMAnOE4bYKUHPCpaEbwNNEMZnYZDUruHXSZaOqb4QAqNcVsiVWauAn1KEyxV0
ybTt6lULRu1JyLM31kAAKiJqxCYV7gXdBoJymDx1FU8SmE7YR2cKVGJM7YhuKAZI
VGg51KgeRldWlDF2y9zoDRmqwwNLmb6RZpxJh1UCgYAGGodCUQ79/Ab0LzrtCaBx
OPQu4OTUp3s/t4co0e+WcDvIa0b6/9gus9yaRUR2QxjdS735/j9fNHLUH9yo4XT7
vT19Ffl4yEGbDB29BolsT30pX91QzBvFf3EGRo/oegIfPdJTh3evGvVHBuulWZqy
Cd+IgUocYJetitLGqfzK1QKBgQCtm9e4wzKLs7WATA1508pjnVdwVTQGKGRrDZio
F4WldaWvKdqPu5O0Lz+vg6xeVW0hEP8k6CuiQVCB7/mC+fsXP9bhfAbkyxpc/dYo
59KqBGa1S6xxOSpkjmHlCzm8Q0Kb9RwPZb8XKT+IclrPKa/C3BvLAJnFUj3ggo+M
j963YQKBgQCDByqxFdPTzeHpZnLHHmmYAN9HbNoxLDX4JCB2iT20lQu1Agp2DgBA
CKlDUOMt6UUIGYKD+Hn8RDUQN3Um8nDaa5RFsy7F9Og57M/VLdvRb0mBvTdgiKSB
wcPDty9QlZ5dfLsagYG5rcFGCDt3FZvpPyaeYcxK9/QC5VvAHj6gbA==
-----END RSA PRIVATE KEY-----
-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEApuLHCQ7uIeWX+fszaToHnBLufpa32EsaQ4pLCKdI/Zflc4VR
eyArQvMm1jUXggCvyAzLCgOLYRcXIOPAbzanLd1Fh+BmqBs0jacLfxD+vN2OEqpw
e7Li3YTN3d032wO9bL2XmUEgoZkUcmkJGoTT34lMDyTgIexWv/4WXwQo6ZdukGqG
OWlFZJwOv/gIZkCk3uUIgvtkp6UAxzIl9EsH5MdEwaHH3hlvao0IFpA/Gfg3VKY6
SnqtIH11Ck2XQD2c0kE7yPkRh71gdTO1tXn1Ch/sWhqprAjqXqNOZIFir4dMKfc+
I25hDxFtp/eUbKExe+/tsuS1CFEDLJJwdVmDMQIDAQABAoIBABBdrv0xbKMAXA4U
127bVQG2TZM2fqMEgnfbKQ6ZMSxFaCgTC/GSLwvqwoVBQaPrI1HwBz1dKZ8E36zH
CQkfB/gUegwgMpEL0fSOTC9S4FhvNc6Yzl0jJuJocrPuTNr6m+n9Ec/itiuC0qGB
sXXbTtfeJApcKGrLPZqodVMuGkEGAyqbiPdp6eYC3C+lkitDcOHCG6Z4WzA6HFr/
Y8TkozUcbgqX18zVUGI7147mYNdQW2Ap20hPqfO1A9MtbqEx05NxQiTsbf8U+QGo
NJ24es3c3fFVZambp/RXfLQuPBciTKmQoD6fWWOybB1a5/Owbb7+aiPAySrSRPHE
Um3wnc0CgYEAxefN703MWHv1fkQGa8fNNw/DoKh5w9nLrNdrfnWGWDvsy9giW1Xq
QYL+Dq+17vQ+TdWOeUWeCG679Oj/bvRiZy15ikR1/KmM3v4KkG3/P+ugLZRdd32X
Ldpg1f3MNtLVXgAbTtd6oy7FVcPThP54s2A5Ab/2yLCq+mFDn5ahsecCgYEA19/p
C0WEvChPzXJanb2npJHy8gHwkuEn0D9zNzKX6ToOKwoqIMjTt2wmbHJd42sbCOc0
S7UKcIof11q7lV7/TnLB+V4C8f6dKe34lF+dGfXDljcqu+uNwXS1JQvQST5OwcGb
foXDtDH10yZroEaCnXBuQ0szMbSZVlh2M67CLycCgYA/tSxU8b1rapQPjoRmo84L
AJcgG7v+8RigzkP7VIfn1XqX8D63GkQrzKhOQAAYKSX5Vlrj7SY/Xq5A29SGekNH
JZtviDRXHpmLm0n5Tn+Rqx9ILO+drJ9DEn6DxIy9xUcMWIpx6em/qCm8PyrTMDvY
uov/ZTVjS4Puz+q97/ajVwKBgCKIm0tGT7mZ6UpAZOafFFZrUqYMUWPtyOSzgcbu
vQZ+Vw3jjmG4PsY08uCeWw6qb6S499C0oXrnXbihtyhqDgWKriUqOOZliNbQTtfN
g+BHRIafRKLTR9YOyXunrCZLZWXxhuJym6AT7fNdThJRtUtiVQFG4mWtMmpxtFcI
OeA5AoGBALI2NDwPF2MCPIQRpkL9aH3RwnBXNFqKseww5IDWbbjL8VaVPPZeDrDg
7gpfPCor+Acd+Rj2qSWgQG2dkG+tv5+zT954fGcEQsV9L/PXl1KrQmgEO3bHFeCn
FNm+zIsFGY58CHyj8sCA9Sq23JlSx5y2E1SF2Skyp2+0n7tdLaOd
-----END RSA PRIVATE KEY-----
-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEAw45ZGszAxk7hg4sosECMtQz/z6nt2OMkgi0uZCm+2h6js/1l
wD4ZBjeS9eR6fE3o2pF/jK9Xd2MRHREeaU6ha1d1HmCyTjWnMNgZP6ZZd9xmOznr
bZx4iyXw8EQ3FC+4lg46XFUeYJLwRZKlt2Ks+s0kWLpE6/KP/TK2LOm710k/9W8/
jlmUkOiw4uYEX8HPSgTeWKZbaVxppTG7CzDD722Q9ZCXGwTJ8uWN5VFdvRXEeHAt
XmsHJmHEjR+R1fJvERgEdRqnEaIsMkRmzRCYr6MKj2Xb+Ro6hU3/7grVzHEKX9jT
DAIX1rCkL0yF5Ka0cLbylUM1ZwpXyDpblQeOiQIDAQABAoIBADkhOvLTYnYM0WEm
pGppUTILbCh00mGMajwFiwoEEBeU3+pTWwiAm7rvPWXMq+PotuAzpXmqN/lO3c8K
E0JckFfVoweO5Eho8EEawLWRmY2ku9ENqLPLBIRSP0NSCm1BS8G6wl37F/bKtpr8
rqEWmMZka/vn3v63TE2CJSqV1iScZLdAJQT8kQNOhDYKXK+yXkcKSXgRSc0KLiYe
GL03cksYp8cBBQEtpGFw4RgK2f9sTuM5L26eOhhDEh46ByKb7cFhTto4VX/Gs61d
92Etkz9TNAEMXNT8DnPdR58/n/9DKf+tGRJD1YktcNOKMzGTxY64QEjcpxFFvRe1
HwyyRQECgYEA0u4k1J0253lhrKAN0A3vmhrUR1jGMMCrtB6WbGZUNbdxiDqGYp+D
x7FJQm2hAth1hSw9js+wkcc18Nn+zQQ+cfNNP69+3W/eLi1JktlZUdDRoN+uioZe
A21FyMY1HbfTcRcnfTKv5kbCYCJBi0z1D5x+YWCdmnFFzNwfG7cu1tkCgYEA7Vc8
xpkUeejefustUGXWMVCOXeafBnIwyWrzyN0SC7zhA1ws/v78MBPPxAjKghD1vKSh
1H+frio7wpFMLe7WZpGfqFoCllARBCR1smcDnoSqRY4EM+FhmDHXcfQ00sHOpztj
KKnlRs75mrVQ2HkPwpYMdNgpM/piIK8oqe1khzECgYAqND4oUICg1hemC6xX2cH8
Sqv4zplxPcvdUVV1wQ/OY7MSt+sVpqceeKmY4giaYic5iz2R6pqAwKRZWbTy3ouE
D1OAj6PJuM1y3drfyB9oEGkxUDBDRVlgRCf3YTlVheeHtENReKfbYoMX6yLENZS/
F+ftogBG261ErTKIQCHeGQKBgQCMMdO8m//0YxHKdrC1pPH4/1SZMvkMnbcjwwFt
zOgz9sYTbgdGOOhOneVELs0wN0Rwwe61zw1Lm7bhH2KYX1RWEf71OvX8RB9JCyBa
2W7R3BuYKmNhIei8NfTFYzMwqzqenf3crz63rNrT//ZZaGlez7Nb8bOk+GmuVMj4
VznigQKBgGHaNPvpmcMFMFeocDM9pGQ/KtzgVUU9mfd4yqhTyQ/pZ+XDPdz0DBQK
lzlCHD844HY1BjQurECe9QgqUB/slaMC3hl7l6bPNHQk7/plNsER7E7hzN6f6PZM
kXxSnDcVQGY0cWZ0FROyYbBp3nBVA5VT5HYYGfazhsisIHP+3zoG
-----END RSA PRIVATE KEY-----
`

func init() {
	data := []byte(rsaKeysPEM)
	for i := 0; i < len(rsaKeys); i++ {
		var block *pem.Block
		block, data = pem.Decode(data)
		key, err := x509.ParsePKCS1PrivateKey(block.Bytes)
		if err != nil {
			panic(err)
		}
		keyID := fmt.Sprintf("key-id-%02d", i)

		rsaKeys[i] = key
		jwKeys[i].KeyID = keyID
		jwKeys[i].Key = key

		// Last key is reserved to test as an unknown key.
		if i < len(rsaKeys)-1 {
			jwksPublic.Keys = append(jwksPublic.Keys, jose.JSONWebKey{
				KeyID: keyID,
				Key:   key.Public(),
			})
		}
	}
}
