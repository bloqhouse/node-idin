describe('Idin Protocol', (): void => {
  afterEach((): void => {
    // Restore library mocks
    jest.resetModules();
  });

  test('testing classes', async () => {
    const { MyKeyInfoGetKey } = require('./idin-protocol');
    expect(new MyKeyInfoGetKey('a').getKey()).toMatch('a');

    const { MyKeyInfoGetKeyInfo } = require('./idin-protocol');
    expect(new MyKeyInfoGetKeyInfo('a').getKeyInfo()).toMatch('<KeyName>a</KeyName>');
  });

  test('error verifyOwnSignature', () => {
    const mockError = 'err';
    jest.mock('xml-crypto', (): any => ({
      xpath: (): string => '',
      SignedXml: function() {
        this.loadSignature = (): void => { return; };
        this.checkSignature = (): any => undefined;
        this.addReference = (): void => { return; };
        this.computeSignature = (): void => { return; };
        this.getSignedXml = (): string => '';
        this.validationErrors = mockError;
      },
    }));
    jest.mock('xmldom');
    const { verifyOwnSignature } = require('./idin-protocol');

    expect(() => verifyOwnSignature({ res: '', xml: '', publicKey: '' })).toThrowError(mockError);
  });

  test('error verifySignature', async () => {
    const mockError = 'err';
    jest.mock('xml-crypto', (): any => ({
      xpath: (): any => ({ pop: (): any => '' }),
      SignedXml: function() {
        this.loadSignature = (): void => { return; };
        this.checkSignature = (): any => undefined;
        this.addReference = (): void => { return; };
        this.computeSignature = (): void => { return; };
        this.getSignedXml = (): string => '';
        this.validationErrors = mockError;
      },
    }));
    jest.mock('xmldom');
    const { verifySignature } = require('./idin-protocol');

    await expect(verifySignature({ routingCert: '', signedXml: 'signed' })).resolves.toMatch('signed');
  });
});
