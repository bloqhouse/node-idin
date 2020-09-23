
# node-idin [![Build Status](https://travis-ci.org/bloqhouse/node-idin.svg?branch=master)](https://travis-ci.org/bloqhouse/node-idin) [![Coverage Status](https://coveralls.io/repos/github/bloqhouse/node-idin/badge.svg?branch=master)](https://coveralls.io/github/bloqhouse/node-idin?branch=master)

  
  

Node.js Library for [iDIN](https://www.idin.nl/). You can find all the protocol documentation [here](https://betaalvereniging.atlassian.net/wiki/spaces/IIDIFMD/pages/588284049/iDIN+Merchant+Implemention+Guide+EN).
Supporting Node 10+.

  

## How to use

Install the dep by:
```bash
yarn add node-idin
```

Create a `NodeIdin` instance:

```ts
const config = {
	merchantId:  '35235',
	merchantSubId:  '0',
	routingEndpoint:  'https://abnamro-test.bank-request.com/bvn-idx-bankid-rs/bankidGateway',
	routingCert:  '-----BEGIN CERTIFICATE-----...',
	privateKey:  '-----BEGIN RSA PRIVATE KEY-----...',
	publicKey:  '-----BEGIN PUBLIC KEY-----...',
	publicKeyFingerprint:  'xekf2o3f...',
}

const idin = new NodeIdin(config);
```

Use the method you need:

```ts
const directory = await idin.getDirectory();
```

```ts
const transaction = await idin.getTransaction({
	loa: 'loa3',
	merchantReturnUrl: 'https://...',
	idPrefix: 'RND',
	requestedService: '21968',
	defaultLanguage: 'en',
	expirationPeriod: 'PT5M',
	issuerId: 'randomId',
	transactionId: 'randomId#2',
});
```

```ts
const status = await idin.getStatus({ transactionId:  '92fo2k3qdd' });
```

## Notes

- Read protocol documentation for a better understanding of the parameters.

- This library does not fully implement the protocol and has some issues that still need to be addressed. Use at your own risk.