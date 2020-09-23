import { GeneralParameters } from './idin-protocol';

jest.mock('xmldom');

describe('Directory Protocol', (): void => {

  afterEach((): void => {
    // Restore library mocks
    jest.resetModules();
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
    const { default: NodeIdin } = require('./index');

    const gParams: GeneralParameters = {
      merchantId: '0',
      merchantSubId: '0',
      privateKey: '',
      publicKey: '',
      publicKeyFingerprint: '',
      routingCert: '',
      routingEndpoint: 'url',
    };

    jest.mock('node-fetch');
    const fetch = require('node-fetch');
    fetch.mockReturnValue(Promise.reject('error1'));

    await expect(new NodeIdin(gParams).getDirectory()).rejects.toThrowError('error1');
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

    const mockIssuers = (arr: boolean) => {
      const mockIssuer = {
        'ns3:issuerID': {
          _text: '',
        },
        'ns3:issuerName': {
          _text: '',
        },
      };
      const countries = {
        'ns3:countryNames': {
          _text: '',
        },
        'ns3:Issuer': arr ? [mockIssuer] : mockIssuer,
      };
      return JSON.stringify({
        'ns3:DirectoryRes': {
          'ns3:createDateTimestamp': {
            _text: '',
          },
          'ns3:Acquirer': {
            'ns3:acquirerID': {
              _text: '',
            },
          },
          'ns3:Directory': {
            'ns3:directoryDateTimestamp': {
              _text: '',
            },
            'ns3:Country': arr ? [countries] : countries,
          },
        },
      });
    };
    jest.mock('xml-js', () => {
      return {
        xml2json: jest.fn()
          .mockReturnValueOnce(mockIssuers(true))
          .mockReturnValueOnce(mockIssuers(false)),
      };
    });
    const toReceive = {
      createDateTimestamp: '',
      Acquirer: {
        acquirerID: '',
      },
      Directory: {
        directoryDateTimestamp: '',
        Country: [{
          countryNames: '',
          Issuer: [{
            issuerID: '',
            issuerName: '',
          }],
        }],
      },
    };
    const { default: NodeIdin } = require('./index');

    const gParams: GeneralParameters = {
      merchantId: '0',
      merchantSubId: '0',
      privateKey: '',
      publicKey: '',
      publicKeyFingerprint: '',
      routingCert: '',
      routingEndpoint: 'url',
    };

    jest.mock('node-fetch');
    const fetch = require('node-fetch');
    // @ts-ignore
    const { Response } = jest.requireActual('node-fetch');
    fetch.mockReturnValueOnce(Promise.resolve(new Response(mockIssuers(true))));

    await expect(new NodeIdin(gParams).getDirectory()).resolves.toMatchObject(toReceive);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith('url', {
      body: '',
      method: 'POST',
    });

    fetch.mockReturnValueOnce(Promise.resolve(new Response(mockIssuers(false))));

    await expect(new NodeIdin(gParams).getDirectory()).resolves.toMatchObject(toReceive);
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(fetch).toHaveBeenCalledWith('url', {
      body: '',
      method: 'POST',
    });
  });
});
