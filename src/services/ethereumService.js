const AccountServiceDecorator = require("./accountServiceDecorator");

class EthereumService extends AccountServiceDecorator {
  constructor(service) {
    super();
    this.service = service;
    this._base = "ETH";
  }

  init(accountId, base, interval) {
    this.service.init(accountId, base ?? this._base, interval);
  }
}

module.exports = EthereumService;
