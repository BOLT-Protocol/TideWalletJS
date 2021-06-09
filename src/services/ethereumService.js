const AccountServiceDecorator = require("./accountServiceDecorator");
const { ACCOUNT } = require("../models/account.model");
class EthereumService extends AccountServiceDecorator {
  constructor(service) {
    super();
    this.service = service;
    this._base = ACCOUNT.ETH;
    this.syncInterval = 15000;
  }

  /**
   @override
  **/
  init(accountId, base, interval) {
    this.service.init(accountId, base ?? this._base, this.syncInterval);
  }

  /**
   @override
  **/
  async start() {
    await this.service.start();
    this.service.timer = setInterval(() => {
      this.synchro();
    }, this.syncInterval);
  }

  /**
   @override
  **/
  stop() {
    this.service.stop();
  }

  /**
   @override
  **/
  getReceivingAddress() {}

  /**
   @override
  **/
  getChangingAddress() {}

  /**
   @override
  **/
  getTransactionFee() {}

  /**
   @override
  **/
  publishTransaction() {}

  /**
   @override
  **/
  updateTransaction() {}

  /**
   @override
  **/
  updateCurrency() {}

  /**
   @override
  **/
  synchro() {
    this.service.synchro();
  }

  // 
  addToken() {}

  estimateGasLimit() {}

  getNonce() {}
}

module.exports = EthereumService;
