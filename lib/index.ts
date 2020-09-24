import getDirectoryResponse from './directory-protocol';
import getTransactionResponse, { TransactionParams } from './transaction-protocol';
import getStatusResponse, { StatusParameters } from './status-protocol';
import { GeneralParameters } from './idin-protocol';

export default class NodeIdin {
  constructor(
    private config: GeneralParameters,
  ) { }

  public getDirectory() {
    return getDirectoryResponse(this.config);
  }

  public getTransaction(transactionConfig: TransactionParams) {
    return getTransactionResponse(this.config, transactionConfig);
  }

  public getStatus(statusConfig: StatusParameters) {
    return getStatusResponse(this.config, statusConfig);
  }
}
