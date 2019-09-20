# node-idin [![Build Status](https://travis-ci.org/bloqhouse/node-idin.svg?branch=master)](https://travis-ci.org/bloqhouse/node-idin) [![Coverage Status](https://coveralls.io/repos/github/bloqhouse/node-idin/badge.svg?branch=master)](https://coveralls.io/github/bloqhouse/node-idin?branch=master)


Node.js Library for [iDIN](https://www.idin.nl/)
<!-- 
1. You have to provide via environment the following variables:
- ROUTING\_ENDPOINT - _routing service url_
- ROUTING\_CERT - _routing service certificate used to verify the responses_
- MERCHANT\_ID - _assigned merchant ID_
- MERCHANT\_SUBID - _can be 0_
- MERCHANT\_RETURN\_URL - _callback url_
- PRIVATE\_KEY - _private key string without whitespaces_
- PUBLIC\_KEY - _public key string without whitespaces_
- PUBLIC\_KEY\_FINGERPRINT - _sha1 hex encoded of the uploaded public key_
- EXPIRATION\_PERIOD - _e.g. PT5M_
- REQUESTED\_SERVICE - _e.g. 21968_
- DEFAULT\_LANGUAGE - _e.g. en_
- LOA - _can be loa2 or loa3_
- ID\_PREFIX - _e.g. ABC_ -->

Node-idin has 3 exportable methods. These methods accept two objects as parameters.

 1. `GeneralParameters` object which includes:
```ts
merchantId: number
merchantSubId: number
routingEndpoint: string // callback url
routingCert: string
publicKey: string
publicKeyFingerprint: string
privateKey: string
```
 2. Specific object per method, more info in the table below.

| Method | Specific object required | Description |
|--|--|--|
| getDirectoryResponse | Not required | Gets the different issuers (banks) available |
| getTransactionResponse | { loa: string, merchantReturnUrl: string, idPrefix: string, requestedService: number, defaultLanguage: string, expirationPeriod: string, issuerId: string, transactionId: string } | Initial step to get the user's data. |
| getStatusResponse | { transactionId: string } | Final data retrieval |

Example:

```ts
try {
	const gParams: GeneralParameters = {
		merchantId: 35235,
		merchantSubId: 0,
		routingEndpoint: 'https://abnamro-test.bank-request.com/bvn-idx-bankid-rs/bankidGateway',
		routingCert: '-----BEGIN CERTIFICATE-----...',
		privateKey: '-----BEGIN RSA PRIVATE KEY-----...',
		publicKey: '-----BEGIN PUBLIC KEY-----...',
		publicKeyFingerprint: 'xekf2o3f...',
	};
	const specificParams: StatusParameters = {
		transactionId: 'wefawef2',
	};
	const data = await getStatusResponse(gParams, specificParams);
	console.log(data)
} catch (e) {
	console.log(e);
}
```
