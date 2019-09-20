import { ifError } from 'assert';
import { fetchResponse } from './idin-request';
import { pd } from 'pretty-data';
import to from 'await-to-js';
import { GeneralParameters, signXml } from './idin-protocol';
import { xml2json } from 'xml-js';

interface DirectoryProtocol {
  merchantId: string
  merchantSubId: string
  privateKey: string
  publicKey: string
  publicKeyFingerprint: string
}

export interface XMLNode {
  _text: string
}

export interface XMLIssuer {
  'ns3:issuerID': XMLNode
  'ns3:issuerName': XMLNode
}

export interface Issuer {
  issuerID: string
  issuerName: string
}

function formatDirectoryProtocolXML({ merchantId, merchantSubId, publicKey, privateKey, publicKeyFingerprint }: DirectoryProtocol) {
  const xml = pd.xmlmin(`
    <?xml version="1.0" encoding="UTF-8"?>
    <DirectoryReq
    version="1.0.0"
    productID="NL:BVN:BankID:1.0"
    xmlns="http://www.betaalvereniging.nl/iDx/messages/Merchant-Acquirer/1.0.0"
    xmlns:ds="http://www.w3.org/2000/09/xmldsig#" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
      <createDateTimestamp>${new Date().toISOString()}</createDateTimestamp>
      <Merchant>
        <merchantID>${merchantId}</merchantID>
        <subID>${merchantSubId}</subID>
      </Merchant>
    </DirectoryReq>
  `);

  return signXml({ xml, publicKey, publicKeyFingerprint, privateKey });
}

function _parseIssuers(issuers: XMLIssuer | XMLIssuer[]): Issuer[] {
  const parse = (issuer: XMLIssuer) => {
    return {
      issuerID: issuer['ns3:issuerID']._text,
      issuerName: issuer['ns3:issuerName']._text,
    };
  };
  return Array.isArray(issuers) ? issuers.map(parse) : [parse(issuers)];
}

export default async function getDirectoryResponse(
  { merchantId, merchantSubId, routingCert, routingEndpoint, privateKey, publicKey, publicKeyFingerprint }: GeneralParameters,
) {
  const [err, res] = await to(fetchResponse({
    payload: formatDirectoryProtocolXML({ merchantSubId, merchantId, privateKey, publicKey, publicKeyFingerprint }),
    routingEndpoint,
    routingCert,
  }));
  ifError(err);
  const parsed = JSON.parse(xml2json(res!, { compact: true }));
  return {
    createDateTimestamp: parsed['ns3:DirectoryRes']['ns3:createDateTimestamp']._text,
    Acquirer: {
      acquirerID: parsed['ns3:DirectoryRes']['ns3:Acquirer']['ns3:acquirerID']._text,
    },
    Directory: {
      directoryDateTimestamp: parsed['ns3:DirectoryRes']['ns3:Directory']['ns3:directoryDateTimestamp']._text,
      Country: {
        countryNames: parsed['ns3:DirectoryRes']['ns3:Directory']['ns3:Country']['ns3:countryNames']._text,
        Issuer: _parseIssuers(parsed['ns3:DirectoryRes']['ns3:Directory']['ns3:Country']['ns3:Issuer']),
      },
    },
  };
}
