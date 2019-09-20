import { ifError } from 'assert';
import to from 'await-to-js';
import fetch from 'node-fetch';
import { verifySignature } from './idin-protocol';

export interface FetchResponseParams {
  payload: string
  routingEndpoint: string
  routingCert: string
}

export async function fetchResponse({ payload, routingCert, routingEndpoint }: FetchResponseParams) {
  const config = {
    method: 'POST',
    body: payload,
  };

  const [responseError, responseData] = await to(fetch(routingEndpoint, config));
  ifError(responseError);

  return verifySignature({ signedXml: await responseData!.text(), routingCert });
}
