import { ifError } from 'assert';
import { pd } from 'pretty-data';
import * as uniqid from 'uniqid';
import { xml2json } from 'xml-js';
import to from 'await-to-js';
import { signXml, GeneralParameters } from './idin-protocol';
import { fetchResponse } from './idin-request';

interface TransactionProtocol extends TransactionParams {
  merchantId: string
  merchantSubId: string
  publicKeyFingerprint: string
  privateKey: string
  publicKey: string
}

function formatTransactionProtocolXML(
  {
    issuerId,
    merchantReturnUrl,
    defaultLanguage,
    expirationPeriod,
    idPrefix,
    loa,
    requestedService,
    transactionId,
    merchantSubId,
    merchantId,
    publicKeyFingerprint,
    privateKey,
    publicKey,
  }: TransactionProtocol,
) {
  const xml = pd.xmlmin(`
    <?xml version="1.0" encoding="UTF-8"?>
    <AcquirerTrxReq version="1.0.0"
      productID="NL:BVN:BankID:1.0"
      xmlns="http://www.betaalvereniging.nl/iDx/messages/Merchant-Acquirer/1.0.0"
      xmlns:ds="http://www.w3.org/2000/09/xmldsig#">
      <createDateTimestamp>${new Date().toISOString()}</createDateTimestamp>
      <Issuer>
        <issuerID>${issuerId}</issuerID>
      </Issuer>
      <Merchant>
        <merchantID>${merchantId}</merchantID>
        <subID>${merchantSubId}</subID>
        <merchantReturnURL>${merchantReturnUrl}</merchantReturnURL>
      </Merchant>
      <Transaction>
        <expirationPeriod>${expirationPeriod}</expirationPeriod>
        <language>${defaultLanguage}</language>
        <entranceCode>${idPrefix}${transactionId}${uniqid.time()}</entranceCode>
        <container>
          <samlp:AuthnRequest
            xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
            xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
            AttributeConsumingServiceIndex="${requestedService}"
            ID="${idPrefix}${transactionId}"
            IssueInstant="${new Date().toISOString()}"
            Version="2.0"
            ProtocolBinding="nl:bvn:bankid:1.0:protocol:iDx"
            AssertionConsumerServiceURL="${merchantReturnUrl}">
            <saml:Issuer>${merchantId}</saml:Issuer>
            <samlp:RequestedAuthnContext Comparison="minimum">
              <saml:AuthnContextClassRef>nl:bvn:bankid:1.0:${loa}</saml:AuthnContextClassRef>
            </samlp:RequestedAuthnContext>
          </samlp:AuthnRequest>
        </container>
      </Transaction>
    </AcquirerTrxReq>
  `);

  return signXml({ xml, publicKey, publicKeyFingerprint, privateKey });
}

export interface TransactionParams {
  loa: string
  merchantReturnUrl: string
  idPrefix: string
  requestedService: string
  defaultLanguage: string
  expirationPeriod: string
  issuerId: string
  transactionId: string
}

export default async function getTransactionResponse(
  { merchantId, merchantSubId, routingCert, routingEndpoint, publicKeyFingerprint, privateKey, publicKey }: GeneralParameters,
  otherParams: TransactionParams,
) {
  const [err, res] = await to(fetchResponse({
    payload: formatTransactionProtocolXML({ ...otherParams, merchantId, merchantSubId, publicKeyFingerprint, privateKey, publicKey }),
    routingEndpoint,
    routingCert,
  }));
  ifError(err);

  const parsed = JSON.parse(xml2json(res!, { compact: true }));
  if (parsed['ns3:AcquirerErrorRes']) {
    return {
      createDateTimestamp: parsed['ns3:AcquirerErrorRes']['ns3:createDateTimestamp'],
      Error: parsed['ns3:AcquirerErrorRes']['ns3:Error'],
    };
  }

  return {
    createDateTimestamp: parsed['ns3:AcquirerTrxRes']['ns3:createDateTimestamp']._text,
    Acquirer: {
      acquirerID: parsed['ns3:AcquirerTrxRes']['ns3:Acquirer']['ns3:acquirerID']._text,
    },
    Issuer: {
      issuerAuthenticationURL: parsed['ns3:AcquirerTrxRes']['ns3:Issuer']['ns3:issuerAuthenticationURL']._text,
    },
    Transaction: {
      transactionID: parsed['ns3:AcquirerTrxRes']['ns3:Transaction']['ns3:transactionID']._text,
      transactionCreateDateTimestamp: parsed['ns3:AcquirerTrxRes']['ns3:Transaction']['ns3:transactionCreateDateTimestamp']._text,
    },
  };
}
