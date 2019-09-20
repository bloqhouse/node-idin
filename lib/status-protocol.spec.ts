import { GeneralParameters } from './idin-protocol';
import { StatusParameters } from './status-protocol';

jest.mock('xmldom');

describe('Status Protocol', (): void => {

  afterEach((): void => {
    // Restore library mocks
    jest.resetModules();
  });

  test('no general object param', async () => {
    const { getStatusResponse } = require('./index');
    // @ts-ignore
    expect(() => getStatusResponse()).toThrow('No general object parameter found.');
  });

  test('no specific object param', async () => {
    const { getStatusResponse } = require('./index');
    const gParams: GeneralParameters = {
      merchantId: '0',
      merchantSubId: '0',
      privateKey: '',
      publicKey: '',
      publicKeyFingerprint: '',
      routingCert: '',
      routingEndpoint: 'url',
    };
    // @ts-ignore
    expect(() => getStatusResponse(gParams)).toThrow('No specific object parameter found.');
  });

  test('missing gen keys', async () => {
    const { getStatusResponse } = require('./index');
    // @ts-ignore
    expect(() => getStatusResponse({}, {})).toThrow('Parameters missing.');
  });

  test('missing specific keys', async () => {
    const { getStatusResponse } = require('./index');
    const gParams: GeneralParameters = {
      merchantId: '0',
      merchantSubId: '0',
      privateKey: '',
      publicKey: '',
      publicKeyFingerprint: '',
      routingCert: '',
      routingEndpoint: 'url',
    };
    // @ts-ignore
    expect(() => getStatusResponse(gParams, {})).toThrow('Parameters missing.');
  });

  test('response error', async () => {
    jest.mock('xml-crypto', (): any => ({
      xpath: (): string => '',
      SignedXml: function() {
        this.loadSignature = (): void => { return; };
        this.checkSignature = (): any => true;
        this.addReference = (): void => { return; };
        this.computeSignature = (): void => { return; };
        this.getSignedXml = (): string => '';
      },
    }));
    const { getStatusResponse } = require('./index');

    const gParams: GeneralParameters = {
      merchantId: '0',
      merchantSubId: '0',
      privateKey: '',
      publicKey: '',
      publicKeyFingerprint: '',
      routingCert: '',
      routingEndpoint: 'url',
    };

    const sParams: StatusParameters = {
      transactionId: 'ff',
    };

    jest.mock('node-fetch');
    const fetch = require('node-fetch');
    fetch.mockReturnValue(Promise.reject('error1'));

    await expect(getStatusResponse(gParams, sParams)).rejects.toThrowError('error1');
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith('url', {
      body: '',
      method: 'POST',
    });
  });

  test('response error error', async () => {
    const mockNameId = 'wefw';
    const mockXpathMapReturn = (saml: '' | '2') => {
      return [JSON.stringify({
        ...!saml ? {
          [`saml${saml}:NameID`]: {
            _text: mockNameId,
          }
        } : {
          [`saml${saml}:Attribute`]: {
            _attributes: {
              Name: 'consumer. consumer.',
            },
            [`saml${saml}:AttributeValue`]: {
              _text: '',
            },
          },
        },
      })];
    };
    jest.mock('xml-crypto', (): any => ({
      xpath: (): any => ({
        pop: (): any => '',
        map: (): string[] => mockXpathMapReturn(''),
      }),
      SignedXml: function() {
        this.loadSignature = (): void => { return; };
        this.checkSignature = (): any => true;
        this.addReference = (): void => { return; };
        this.computeSignature = (): void => { return; };
        this.getSignedXml = (): string => '';
      },
    }));
    jest.mock('xml-encryption-beta', (): any => ({
      decrypt: (): string => '',
    }));

    const mockStatus = {
      'awidxma:AcquirerErrorRes': {
        'awidxma:createDateTimestamp': {
          _text: '',
        },
        'ns3:Error': { },
      },
    };
    jest.mock('xml-js', () => {
      return {
        xml2json: jest.fn()
          .mockReturnValueOnce(JSON.stringify(mockStatus))
          .mockReturnValueOnce(mockXpathMapReturn('')),
      };
    });
    const { getStatusResponse } = require('./index');

    const gParams: GeneralParameters = {
      merchantId: '0',
      merchantSubId: '0',
      privateKey: '',
      publicKey: '',
      publicKeyFingerprint: '',
      routingCert: '',
      routingEndpoint: 'url',
    };
    const sParams: StatusParameters = {
      transactionId: 'ff',
    };

    jest.mock('node-fetch');
    const fetch = require('node-fetch');
    // @ts-ignore
    const { Response } = jest.requireActual('node-fetch');
    fetch.mockReturnValueOnce(Promise.resolve(new Response(mockStatus)));

    await expect(getStatusResponse(gParams, sParams)).resolves.toMatchObject({
      createDateTimestamp: { _text: '' },
      Error: {},
    });
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith('url', {
      body: '',
      method: 'POST',
    });
  });

  test('try error', async () => {
    const mockNameId = 'wefw';
    const mockXpathMapReturn = (saml: '' | '2') => {
      return [JSON.stringify({
        ...!saml ? {
          [`saml${saml}:NameID`]: {
            _text: mockNameId,
          }
        } : {
          [`saml${saml}:Attribute`]: {
            _attributes: {
              Name: 'consumer. consumer.',
            },
            [`saml${saml}:AttributeValue`]: {
              _text: '',
            },
          },
        },
      })];
    };
    jest.mock('xml-crypto', (): any => ({
      xpath: (): any => ({
        pop: (): any => '',
        map: (): string[] => mockXpathMapReturn(''),
      }),
      SignedXml: function() {
        this.loadSignature = (): void => { return; };
        this.checkSignature = (): any => true;
        this.addReference = (): void => { return; };
        this.computeSignature = (): void => { return; };
        this.getSignedXml = (): string => '';
      },
    }));
    jest.mock('xml-encryption-beta', (): any => ({
      decrypt: (): string => '',
    }));

    const mockTransactionId = '4fwef1';
    const mockInResponseTo = 'fawefaw';
    const mockStatusCode = 'www222awefaw';
    const mockIssuerId = 'awefw';
    const mockStatusDateTime = 'wefawef';

    const mockStatus = (saml: '' | '2') => {

      return {
        'awidxma:AcquirerStatusRes': {
          'awidxma:createDateTimestamp': {
            _text: '',
          },
          'awidxma:Acquirer': {
            'awidxma:acquirerID': {
              _text: '',
            },
          },
          'awidxma:Transaction': {
            'awidxma:transactionID': {
              _text: mockTransactionId,
            },
            'awidxma:status': {
              _text: mockStatusCode,
            },
            'awidxma:statusDateTimestamp': {
              _text: mockStatusDateTime,
            },
            'awidxma:container': {
              ...!saml
              ? {
                'samlp:Response': '',
              }
              : {},
              [`saml${saml}p:Response`]: {
                _attributes: {
                  ID: mockTransactionId,
                  InResponseTo: mockInResponseTo,
                },
                [`saml${saml}p:Status`]: {
                  [`saml${saml}p:StatusCode`]: {
                  },
                },
                [`saml${saml}:Assertion`]: {
                  [`saml${saml}:Issuer`]: {
                    _text: mockIssuerId,
                  },
                },
              },
            },
          },
        },
      };
    };
    jest.mock('xml-js', () => {
      return {
        xml2json: jest.fn()
          .mockReturnValueOnce(JSON.stringify(mockStatus('')))
          .mockReturnValueOnce(mockXpathMapReturn('')),
      };
    });
    const { getStatusResponse } = require('./index');

    const gParams: GeneralParameters = {
      merchantId: '0',
      merchantSubId: '0',
      privateKey: '',
      publicKey: '',
      publicKeyFingerprint: '',
      routingCert: '',
      routingEndpoint: 'url',
    };
    const sParams: StatusParameters = {
      transactionId: 'ff',
    };

    jest.mock('node-fetch');
    const fetch = require('node-fetch');
    // @ts-ignore
    const { Response } = jest.requireActual('node-fetch');
    fetch.mockReturnValueOnce(Promise.resolve(new Response(mockStatus(''))));

    await expect(getStatusResponse(gParams, sParams)).rejects.toThrowError();
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith('url', {
      body: '',
      method: 'POST',
    });
  });

  test('response success', async () => {
    const mockNameId = 'wefw';
    const mockConsumer = 'wef22wa';
    const mockConsumerText = 'texttt';
    const mockXpathMapReturn = (saml: '' | '2') => {
      return [JSON.stringify({
        ...!saml ? {
          [`saml${saml}:NameID`]: {
            _text: mockNameId,
          }
        } : {
          [`saml${saml}:Attribute`]: {
            _attributes: {
              Name: `consumer.${mockConsumer}`,
            },
            [`saml${saml}:AttributeValue`]: {
              _text: mockConsumerText,
            },
          },
        },
      })];
    };
    jest.mock('xml-crypto', (): any => ({
      xpath: jest.fn()
        .mockReturnValueOnce(mockXpathMapReturn(''))
        .mockReturnValueOnce(mockXpathMapReturn(''))
        .mockReturnValueOnce(mockXpathMapReturn(''))
        .mockReturnValueOnce(mockXpathMapReturn('2'))
        .mockReturnValueOnce(mockXpathMapReturn('2'))
        .mockReturnValueOnce(mockXpathMapReturn('2')),
      SignedXml: function() {
        this.loadSignature = (): void => { return; };
        this.checkSignature = (): any => true;
        this.addReference = (): void => { return; };
        this.computeSignature = (): void => { return; };
        this.getSignedXml = (): string => '';
      },
    }));
    jest.mock('util', (): any => ({
      promisify: (callback): any => callback,
    }));
    jest.mock('xml-encryption-beta', (): any => ({
      decrypt: (s: string): Promise<string> => Promise.resolve(s),
    }));

    const mockTransactionId = '4fwef1';
    const mockInResponseTo = 'fawefaw';
    const mockStatusCode = 'www222awefaw';
    const mockResponseStatusCode = 'awefaw';
    const mockIssuerId = 'awefw';
    const mockStatusDateTime = 'wefawef';

    const mockStatus = (saml: '' | '2') => {

      return {
        'awidxma:AcquirerStatusRes': {
          'awidxma:createDateTimestamp': {
            _text: '',
          },
          'awidxma:Acquirer': {
            'awidxma:acquirerID': {
              _text: '',
            },
          },
          'awidxma:Transaction': {
            'awidxma:transactionID': {
              _text: mockTransactionId,
            },
            'awidxma:status': {
              _text: mockStatusCode,
            },
            'awidxma:statusDateTimestamp': {
              _text: mockStatusDateTime,
            },
            'awidxma:container': {
              ...!saml
              ? {
                'samlp:Response': '',
              }
              : {},
              [`saml${saml}p:Response`]: {
                _attributes: {
                  ID: mockTransactionId,
                  InResponseTo: mockInResponseTo,
                },
                [`saml${saml}p:Status`]: {
                  [`saml${saml}p:StatusCode`]: {
                    _attributes: {
                      Value: `status:${mockResponseStatusCode}`,
                    },
                  },
                },
                [`saml${saml}:Assertion`]: {
                  [`saml${saml}:Issuer`]: {
                    _text: mockIssuerId,
                  },
                },
              },
            },
          },
        },
      };
    };
    jest.mock('xml-js', () => {
      return {
        xml2json: jest.fn()
          .mockReturnValueOnce(JSON.stringify(mockStatus('')))
          .mockReturnValueOnce(mockXpathMapReturn(''))
          .mockReturnValueOnce(JSON.stringify(mockStatus('2')))
          .mockReturnValueOnce(mockXpathMapReturn('2')),
      };
    });
    const toReceive1 = {
      createDateTimestamp: '',
      Acquirer: {
        acquirerID: '',
      },
      Transaction: {
        Response: {
          TransactionID: mockTransactionId,
          EntranceCode: mockInResponseTo,
          StatusCode: mockResponseStatusCode,
          IssuerID: mockIssuerId,
          Attributes: {
            NameID: mockNameId,
          },
        },
        status: mockStatusCode,
        statusDateTimestamp: mockStatusDateTime,
        transactionID: mockTransactionId,
      },
    };
    const { getStatusResponse } = require('./index');

    const gParams: GeneralParameters = {
      merchantId: '0',
      merchantSubId: '0',
      privateKey: '',
      publicKey: '',
      publicKeyFingerprint: '',
      routingCert: '',
      routingEndpoint: 'url',
    };
    const sParams: StatusParameters = {
      transactionId: 'ff',
    };

    jest.mock('node-fetch');
    const fetch = require('node-fetch');
    // @ts-ignore
    const { Response } = jest.requireActual('node-fetch');
    fetch.mockReturnValueOnce(Promise.resolve(new Response(mockStatus(''))));

    await expect(getStatusResponse(gParams, sParams)).resolves.toMatchObject(toReceive1);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith('url', {
      body: '',
      method: 'POST',
    });

    const toReceive2 = {
      createDateTimestamp: '',
      Acquirer: {
        acquirerID: '',
      },
      Transaction: {
        Response: {
          TransactionID: mockTransactionId,
          EntranceCode: mockInResponseTo,
          StatusCode: mockResponseStatusCode,
          IssuerID: mockIssuerId,
          Attributes: {
            [mockConsumer]: mockConsumerText,
          },
        },
        status: mockStatusCode,
        statusDateTimestamp: mockStatusDateTime,
        transactionID: mockTransactionId,
      },
    };

    fetch.mockReturnValueOnce(Promise.resolve(new Response(mockStatus('2'))));

    await expect(getStatusResponse(gParams, sParams)).resolves.toMatchObject(toReceive2);
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(fetch).toHaveBeenCalledWith('url', {
      body: '',
      method: 'POST',
    });
  });
});
