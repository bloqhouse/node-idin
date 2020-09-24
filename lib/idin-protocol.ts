import { SignedXml, xpath } from 'xml-crypto';
import { DOMParser } from 'xmldom';

export interface GeneralParameters {
  merchantId: string
  merchantSubId: string
  routingEndpoint: string
  routingCert: string
  publicKey: string
  publicKeyFingerprint: string
  privateKey: string
}

export interface VerifySignatureParams {
  signedXml: string
  routingCert: string
}

interface MyKeyInfoI {
  getKey?(): string
  getKeyInfo?(): string
}

export class MyKeyInfoGetKey implements MyKeyInfoI {
  private k = '';

  constructor(k: string) {
    this.k = k;
  }

  public getKey() {
    return this.k;
  }
}

export class MyKeyInfoGetKeyInfo implements MyKeyInfoI {
  private k = '';

  constructor(k: string) {
    this.k = `<KeyName>${k}</KeyName>`;
  }

  public getKeyInfo() {
    return this.k;
  }
}

const transformers = ['http://www.w3.org/2000/09/xmldsig#enveloped-signature', 'http://www.w3.org/2001/10/xml-exc-c14n#'];

export async function verifySignature({ routingCert, signedXml }: VerifySignatureParams) {
  const DOM = new DOMParser();
  const XML = new SignedXml(null, { implicitTransforms: transformers });
  // XML.signatureAlgorithm = 'http://www.w3.org/2001/04/xmldsig-more#rsa-sha512'
  XML.keyInfoProvider = new MyKeyInfoGetKey(routingCert);
  const doc = DOM.parseFromString(signedXml.trim());
  const signature = xpath(doc, '/*/*[local-name(.)=\'Signature\' and namespace-uri(.)=\'http://www.w3.org/2000/09/xmldsig#\']');
  const lastSig = signature.pop();
  XML.loadSignature(lastSig);

  const result = XML.checkSignature(signedXml.trim());
  if (!result) {
    console.log(new Error(XML.validationErrors));
  }

  return signedXml;
}

export interface SignXmlParams {
  xml: string
  publicKey: string
  publicKeyFingerprint: string
  privateKey: string
}

export function signXml({ xml, publicKey, publicKeyFingerprint, privateKey }: SignXmlParams) {
  const sig = new SignedXml();
  const entryPoint = '/*';
  const xmlenc = 'http://www.w3.org/2001/04/xmlenc#sha256';
  const signatureAlgorithm = 'http://www.w3.org/2001/04/xmldsig-more#rsa-sha256';

  sig.addReference(entryPoint, transformers, xmlenc, void 0, void 0, void 0, true);
  sig.keyInfoProvider = new MyKeyInfoGetKeyInfo(publicKeyFingerprint);
  sig.signatureAlgorithm = signatureAlgorithm;
  sig.signingKey = privateKey;
  sig.computeSignature(xml);
  const res = sig.getSignedXml();
  verifyOwnSignature({ res, xml, publicKey });

  return res;
}

export interface VerifyOwnSignatureParams {
  res: string
  xml: string
  publicKey: string
}

export function verifyOwnSignature({ res, xml, publicKey }: VerifyOwnSignatureParams) {
  const doc = new DOMParser().parseFromString(res);
  const signature = xpath(doc, '/*/*[local-name(.)=\'Signature\' and namespace-uri(.)=\'http://www.w3.org/2000/09/xmldsig#\']')[0];
  const sx = new SignedXml(null, { implicitTransforms: transformers });

  sx.keyInfoProvider = new MyKeyInfoGetKey(publicKey);
  sx.loadSignature(signature);

  const result = sx.checkSignature(xml);
  if (!result) {
    throw new Error(sx.validationErrors);
  }
}
