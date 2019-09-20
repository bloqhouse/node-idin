import { GeneralParameters } from './idin-protocol';
import { TransactionParams } from './transaction-protocol';

jest.mock('xmldom');

describe('Transaction Protocol', (): void => {

  afterEach((): void => {
    // Restore library mocks
    jest.resetModules();
  });

  test('no general object param', async () => {
    const { getTransactionResponse } = require('./index');
    // @ts-ignore
    expect(() => getTransactionResponse()).toThrow('No general object parameter found.');
  });

  test('no specific object param', async () => {
    const { getTransactionResponse } = require('./index');
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
    expect(() => getTransactionResponse(gParams)).toThrow('No specific object parameter found.');
  });

  test('missing gen keys', async () => {
    const { getTransactionResponse } = require('./index');
    // @ts-ignore
    expect(() => getTransactionResponse({}, {})).toThrow('Parameters missing.');
  });

  test('missing specific keys', async () => {
    const { getTransactionResponse } = require('./index');
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
    expect(() => getTransactionResponse(gParams, {})).toThrow('Parameters missing.');
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
    const { getTransactionResponse } = require('./index');

    const gParams: GeneralParameters = {
      merchantId: '0',
      merchantSubId: '0',
      privateKey: '',
      publicKey: '',
      publicKeyFingerprint: '',
      routingCert: '',
      routingEndpoint: 'url',
    };

    const sParams: TransactionParams = {
      defaultLanguage: 'en',
      expirationPeriod: '',
      idPrefix: '',
      issuerId: '',
      loa: '',
      merchantReturnUrl: '',
      requestedService: '46346',
      transactionId: '',
    };

    jest.mock('node-fetch');
    const fetch = require('node-fetch');
    fetch.mockReturnValue(Promise.reject('error1'));

    await expect(getTransactionResponse(gParams, sParams)).rejects.toThrowError('error1');
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith('url', {
      body: '',
      method: 'POST',
    });
  });

  test('response success', async () => {
    jest.mock('xml-crypto', (): any => ({
      xpath: (): any => ({ pop: (): any => '' }),
      SignedXml: function() {
        this.loadSignature = (): void => { return; };
        this.checkSignature = (): any => true;
        this.addReference = (): void => { return; };
        this.computeSignature = (): void => { return; };
        this.getSignedXml = (): string => '';
      },
    }));
    const mockAcId = 'waefafw';
    const mockIssuerUrl = 'http';
    const transactionId = 'waefawef';
    const transactTimestamp = 'fwef';
    const mockAcqErr = (err: boolean) => {
      if (err) {
        return JSON.stringify({
          'ns3:AcquirerErrorRes': {
            'ns3:createDateTimestamp': '',
            'ns3:Error': 'err',
          },
        });
      }

      return JSON.stringify({
        'ns3:AcquirerTrxRes': {
          'ns3:createDateTimestamp': {
            _text: '',
          },
          'ns3:Acquirer': {
            'ns3:acquirerID': {
              _text: mockAcId,
            },
          },
          'ns3:Issuer': {
            'ns3:issuerAuthenticationURL': {
              _text: mockIssuerUrl,
            },
          },
          'ns3:Transaction': {
            'ns3:transactionID': {
              _text: transactionId,
            },
            'ns3:transactionCreateDateTimestamp': {
              _text: transactTimestamp,
            },
          },
        },
      });
    };
    jest.mock('xml-js', () => {
      return {
        xml2json: jest.fn()
          .mockReturnValueOnce(mockAcqErr(true))
          .mockReturnValueOnce(mockAcqErr(false)),
      };
    });

    const { getTransactionResponse } = require('./index');

    const gParams: GeneralParameters = {
      merchantId: '0',
      merchantSubId: '0',
      privateKey: '',
      publicKey: '',
      publicKeyFingerprint: '',
      routingCert: '',
      routingEndpoint: 'url',
    };

    const sParams: TransactionParams = {
      defaultLanguage: 'en',
      expirationPeriod: '',
      idPrefix: '',
      issuerId: '',
      loa: '',
      merchantReturnUrl: '',
      requestedService: '46346',
      transactionId: '',
    };

    const toReceive1 = {
      Error: 'err',
      createDateTimestamp: '',
    };

    jest.mock('node-fetch');
    const fetch = require('node-fetch');
    // @ts-ignore
    const { Response } = jest.requireActual('node-fetch');
    fetch.mockReturnValueOnce(Promise.resolve(new Response(mockAcqErr(true))));

    await expect(getTransactionResponse(gParams, sParams)).resolves.toMatchObject(toReceive1);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith('url', {
      body: '',
      method: 'POST',
    });

    const toReceive2 = {
      createDateTimestamp: '',
      Acquirer: {
        acquirerID: mockAcId,
      },
      Issuer: {
        issuerAuthenticationURL: mockIssuerUrl,
      },
      Transaction: {
        transactionCreateDateTimestamp: transactTimestamp,
      }
    };

    fetch.mockReturnValueOnce(Promise.resolve(new Response(mockAcqErr(false))));

    await expect(getTransactionResponse(gParams, sParams)).resolves.toMatchObject(toReceive2);
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(fetch).toHaveBeenCalledWith('url', {
      body: '',
      method: 'POST',
    });
  });
});
