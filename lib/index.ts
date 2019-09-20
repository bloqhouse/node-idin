import { checkParams } from './utils';
import getDirectory from './directory-protocol';
import getTransaction, { TransactionParams } from './transaction-protocol';
import getStatus, { StatusParameters } from './status-protocol';
import { GeneralParameters } from './idin-protocol';

export function getDirectoryResponse(arg1: GeneralParameters) {
  checkParams('getDirectory', ...arguments);
  return getDirectory(arg1);
}

export function getStatusResponse(arg1: GeneralParameters, arg2: StatusParameters) {
  checkParams('getStatus', ...arguments);
  return getStatus(arg1, arg2);
}

export function getTransactionResponse(arg1: GeneralParameters, arg2: TransactionParams) {
  checkParams('getTransaction', ...arguments);
  return getTransaction(arg1, arg2);
}

export { GeneralParameters, TransactionParams, StatusParameters };
