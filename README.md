# node-idin [![Build Status](https://travis-ci.org/bloqhouse/node-idin.svg?branch=master)](https://travis-ci.org/bloqhouse/node-idin) [![Coverage Status](https://coveralls.io/repos/github/bloqhouse/node-idin/badge.svg?branch=master)](https://coveralls.io/github/bloqhouse/node-idin?branch=master)


Node.js Library for [iDIN](https://www.idin.nl/)

Node-idin has 3 exportable methods. These methods accept two objects as parameters.

 1. `GeneralParameters` object which includes:
```ts
merchantId: string
merchantSubId: string
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
		merchantId: '35235',
		merchantSubId: '0',
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
