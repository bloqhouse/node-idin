import { GeneralParameters } from './idin-protocol';
import { TransactionParams } from './transaction-protocol';
import { StatusParameters } from './status-protocol';

/**
 * Checking all params are filled
 * @param generalParameters
 */
export const checkParams = (funcName: string, generalParams?: GeneralParameters, specificParams?: TransactionParams | StatusParameters) => {
  if (!generalParams) {
    throw new Error('No general object parameter found.');
  }

  if ((funcName === 'getTransaction' || funcName === 'getStatus') && !specificParams) {
    throw new Error('No specific object parameter found.');
  }

  const keysIteration = (keyArray: string[], params: GeneralParameters | TransactionParams | StatusParameters) => {
    if (keyArray.some((key): boolean => !Object.keys(params).some((innerKey): boolean => innerKey === key))) {
      throw new Error('Parameters missing.');
    }
  };

  if (funcName === 'getTransaction') {
    const sKeys: TransactionParams = {
      defaultLanguage: '',
      expirationPeriod: '',
      idPrefix: '',
      issuerId: '',
      loa: '',
      merchantReturnUrl: '',
      requestedService: 0,
      transactionId: '',
    };
    keysIteration(Object.keys(sKeys), specificParams as TransactionParams);
  } else if (funcName === 'getStatus') {
    const sKeys: StatusParameters = {
      transactionId: '',
    };
    keysIteration(Object.keys(sKeys), specificParams as StatusParameters);
  }

  const gKeys: GeneralParameters = {
    merchantId: 0,
    merchantSubId: 0,
    privateKey: '',
    publicKey: '',
    publicKeyFingerprint: '',
    routingCert: '',
    routingEndpoint: '',
  };
  keysIteration(Object.keys(gKeys), generalParams);
};
