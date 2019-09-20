import { ifError } from 'assert';
import to from 'await-to-js';
import { promisify } from 'util';
import { pd } from 'pretty-data';
import { xpath } from 'xml-crypto';
import { decrypt } from 'xml-encryption-beta';
import { xml2json } from 'xml-js';
import { DOMParser } from 'xmldom';
import { signXml, GeneralParameters } from './idin-protocol';
import { fetchResponse } from './idin-request';

interface StatusProtocol extends StatusParameters {
  merchantId: string
  merchantSubId: string
  privateKey: string
  publicKeyFingerprint: string
  publicKey: string
}

function formatStatusProtocolXML({ transactionId, merchantId, merchantSubId, privateKey, publicKeyFingerprint, publicKey }: StatusProtocol) {
  const xml = pd.xmlmin(`
    <?xml version="1.0" encoding="UTF-8"?>
    <AcquirerStatusReq
    version="1.0.0"
    productID="NL:BVN:BankID:1.0"
    xmlns="http://www.betaalvereniging.nl/iDx/messages/Merchant-Acquirer/1.0.0"
    xmlns:ds="http://www.w3.org/2000/09/xmldsig#"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
      <createDateTimestamp>${new Date().toISOString()}</createDateTimestamp>
      <Merchant>
        <merchantID>${merchantId}</merchantID>
        <subID>${merchantSubId}</subID>
      </Merchant>
      <Transaction>
        <transactionID>${transactionId}</transactionID>
      </Transaction>
    </AcquirerStatusReq>
  `);

  return signXml({ xml, publicKey, publicKeyFingerprint, privateKey });
}

export interface StatusParameters {
  transactionId: string
}

export default async function getStatusResponse(
  { merchantId, merchantSubId, routingCert, routingEndpoint, privateKey, publicKeyFingerprint, publicKey }: GeneralParameters,
  { transactionId }: StatusParameters,
) {
  const [err, statusResponse] = await to(
    fetchResponse({
      payload: formatStatusProtocolXML({ merchantId, merchantSubId, transactionId, privateKey, publicKeyFingerprint, publicKey }),
      routingEndpoint,
      routingCert,
    }),
  );
  ifError(err);

  const xpathQuery = '//*[local-name(.)=\'EncryptedData\']';
  const xpathRes = xpath(new DOMParser().parseFromString(statusResponse!), xpathQuery);
  const pDecrypt = promisify(decrypt);
  const promises = xpathRes.map((res: any) => pDecrypt(res.toString(), { key: privateKey }));
  const [err1, attributes] = await to(Promise.all(promises));
  ifError(err1);

  const parsed = JSON.parse(xml2json(statusResponse!, { compact: true }));
  if (parsed['awidxma:AcquirerErrorRes']) {
    const error = parsed['awidxma:AcquirerErrorRes'];
    return {
      createDateTimestamp: error['awidxma:createDateTimestamp'],
      Error: error['awidxma:Error'],
    };
  }

  const acqStatusRes = parsed['awidxma:AcquirerStatusRes'];
  const response = {
    createDateTimestamp: acqStatusRes['awidxma:createDateTimestamp']._text,
    Acquirer: {
      acquirerID: acqStatusRes['awidxma:Acquirer']['awidxma:acquirerID']._text,
    },
    Transaction: {
      transactionID: acqStatusRes['awidxma:Transaction']['awidxma:transactionID']._text,
      status: acqStatusRes['awidxma:Transaction']['awidxma:status']._text,
      statusDateTimestamp: acqStatusRes['awidxma:Transaction']['awidxma:statusDateTimestamp']._text,
      Response: {},
    },
  };

  const container = acqStatusRes['awidxma:Transaction']['awidxma:container'];
  const saml = (container as { [key: string]: any }).hasOwnProperty('samlp:Response') ? '' : '2';

  try {
    response.Transaction.Response = {
      TransactionID: container[`saml${saml}p:Response`]._attributes.ID,
      EntranceCode: container[`saml${saml}p:Response`]._attributes.InResponseTo,
      StatusCode: container[`saml${saml}p:Response`][`saml${saml}p:Status`][`saml${saml}p:StatusCode`]._attributes.Value.split('status:')[1],
      IssuerID: container[`saml${saml}p:Response`][`saml${saml}:Assertion`][`saml${saml}:Issuer`]._text,
      Attributes: Object.assign(
        {},
        ...(attributes as any[]).map(
          (a: any) => JSON.parse(xml2json(a, { compact: true }) as any),
        ).map(
          (a) => ({
            [(a[`saml${saml}:NameID`] && 'NameID') || a[`saml${saml}:Attribute`]._attributes.Name.split('consumer.')[1]]:
              (a[`saml${saml}:NameID`] && a[`saml${saml}:NameID`]._text) || a[`saml${saml}:Attribute`][`saml${saml}:AttributeValue`]._text,
          }),
        ),
      ),
    };
  } catch (e) {
    ifError(e);
  }

  return response;
}
