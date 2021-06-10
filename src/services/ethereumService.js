const AccountServiceDecorator = require("./accountServiceDecorator");
// const { ACCOUNT } = require("../models/account.model");
const HTTPAgent = require('../helpers/httpAgent');
// const config = require('../constants/config');

class EthereumService extends AccountServiceDecorator {
  constructor(service) {
    super();
    this.service = service;
    // this._base = ACCOUNT.ETH;
    this.syncInterval = 15000;

    this._address = ''
    this._fee = ''
    this._gasLimit = ''
    this._feeTimestamp = ''
    this._nonce = 0

    this._HTTPAgent = new HTTPAgent()

    // mock DBOperator
    this._DBOperator = {
      accountCurrencyDao: {
        insertAccount: () => {},
        findJoinedByAccountId: () => {},
      }
    }
  }

  /**
    @override
  **/
  init(accountId, base, interval = 15000) {
    this.service.init(accountId, base || this._base, interval !== 15000 ?  interval : this.syncInterval);
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

  // /**
  //  * getReceivingAddress
  //  * @override
  //  * @param {String} currencyId
  //  * @returns {Array.<{address: String || error, code: Number}>} result
  // **/
  // getReceivingAddress(currencyId) {
  //   if (this._address === null) {
  //     const response = await this._HTTPAgent.get(`${config.url}/wallet/account/address/${currencyId}/receive`);
  //     if (response.success) {
  //       const data = response['data'];
  //       const address = data['address'];
  //       this._address = address;

  //       console.debug(`_address: ${this._address}`);
  //       return [this._address, null];
  //     } else {
  //       //TODO
  //       return ['error', 0];
  //     }
  //   }
  //   console.debug(`_address: ${this._address}`);
  //   return [this._address, null];
  // }

  /**
   * getChangingAddress
   * @override
   * @param {String} currencyId
   * @returns {{address: String || error, code: Number}[]} result
  **/
  async getChangingAddress(currencyId) {
    return await this.getReceivingAddress(currencyId);
  }

  /**
   * getTransactionFee
   * @override
   * @param {String} blockchainId
   * @returns {Object} result
   * @returns {string} result.slow
   * @returns {string} result.standard
   * @returns {string} result.fast
  **/
  getTransactionFee(blockchainId) {
    if (this._fee == null || Math.floor(new Date() / 1000) - this._feeTimestamp > this.AVERAGE_FETCH_FEE_TIME) {
      const response = await this._HTTPAgent.get(`${config.url}/blockchain/${blockchainId}/fee`);
      if (response.success) {
        const { data } = response; // FEE will return String
        const { slow, standard, fast } = data
        this._fee = {
          slow,
          standard,
          fast,
        };
        this._feeTimestamp = Math.floor(new Date() / 1000);
      } else {
        // TODO fee = null 前面會出錯
      }
    }
    return this._fee;
  }

  // /**
  //  * publishTransaction
  //  * @override
  //  * @param {String} blockchainId
  //  * @param {Transaction} transaction
  //  * @returns {Array.<{success: Boolean, transaction: String}>} result
  // **/
  // async publishTransaction(blockchainId, transaction) {
  //   const response = await this._HTTPAgent().post(`${config.url}/blockchain/${blockchainId}/push-tx`, { hex: '0x' +  new Buffer(transaction.serializeTransaction).toString('hex') });
  //   const { success, data } = response.success;
  //   // transaction.id = response.data['txid'];
  //   transaction.txId = data['txid'];
  //   transaction.timestamp = Math.floor(new Date() / 1000);
  //   transaction.confirmations = 0;
  //   return [success, transaction];
  // }

  // /**
  //  * updateTransaction
  //  * @override
  //  * @param {String} currencyId
  //  * @param {Object} payload
  //  * @returns {Object} transaction table object
  // **/
  // async updateTransaction(currencyId, payload) {
  //   return this.service.updateTransaction(currencyId, payload)
  // }

  // /**
  //  * updateCurrency
  //  * @override
  //  * @param {String} currencyId
  //  * @param {Object} payload
  //  * @returns {Object} currency table object
  // **/
  // async updateCurrency(currencyId, payload) {
  //   return await this.service.updateCurrency(currencyId, payload)
  // }

  // /**
  // * @override
  // **/
  // synchro() {
  //   this.service.synchro();
  // }

  // /**
  //  * addToken
  //  * @override
  //  * @param {String} blockchainId
  //  * @param {Object} token
  //  * @returns {Boolean} result
  // **/
  // addToken(blockchainId, tk) {
  //   const res = await this._HTTPAgent.post(`${config.url}/wallet/blockchain/${blockchainId}/contract/${token.contract}`, {});
  //   if (res.success == false) return false;
  //   console.debug(`Token res.data: ${res.data}`);

  //   try {
  //     const id = res.data['token_id'];
  //     const updateResult = await this._HTTPAgent.get(`${config.url}/wallet/account/${this.service.accountId}`);

  //     if (updateRes.success) {
  //       const accountItem = updateResult.data;
  //       const tokens = [accountItem, ...accountItem['tokens']];
  //       const index = tokens.findIndex((token) => token['token_id'] == id);
  //       const data = {
  //         ...tokens[index],
  //         'icon': token.imgUrl ?? acc['icon'],
  //         'currency_id': id
  //       };
  //       console.debug(`Token data: ${data}`);

  //       // TODO: CurrencyEntity
  //       await this._DBOperator().currencyDao.insertCurrency(data);
  //       console.log();(id);

  //       const now = Math.floor(new Date() / 1000);
  //       // const v = AccountCurrencyEntity.fromJson(tks[index], this.service.accountId, now);

  //       await this._DBOperator.accountCurrencyDao.insertAccount({
  //         token: tokens[index], accountId: this.service.accountId, now
  //       });

  //       // const findAccountCurrencies = await this._DBOperator
  //       //     .accountCurrencyDao
  //       //     .findJoinedByAccountId(this.service.accountId);

  //       // List<Currency> cs = findAccountCurrencies
  //       //     .map((c) => Currency.fromJoinCurrency(c, jcs[0], this.base))
  //       //     .toList();

  //       // TODO: messenger
  //       // const msg = AccountMessage(evt: ACCOUNT_EVT.OnUpdateAccount, value: cs[0]);
  //       // this.service.AccountCore().currencies[this.service.accountId] = cs;

  //       // AccountMessage currMsg = AccountMessage(
  //       //     evt: ACCOUNT_EVT.OnUpdateCurrency,
  //       //     value: this.service.AccountCore().currencies[this.service.accountId]);

  //       // this.service.AccountCore().messenger.add(msg);
  //       // this.service.AccountCore().messenger.add(currMsg);
  //       return true;
  //     } else {
  //       return false;
  //     }
  //   } catch (e) {
  //     Log.error(e);

  //     return false;
  //   }
  // }

  // /**
  //  * estimateGasLimit
  //  * @override
  //  * @param {String} blockchainId
  //  * @param {String} from
  //  * @param {String} to
  //  * @param {String} amount
  //  * @param {String} message
  //  * @returns {Boolean} result
  // **/
  // async estimateGasLimit(blockchainId, from, to, amount, message) {
  //   if (message == '0x' && this._gasLimit != null) {
  //     return this._gasLimit
  //   } else {
  //     const payload = {
  //       "fromAddress": from,
  //       "toAddress": to,
  //       "value": amount,
  //       "data": message
  //     };
  //     const response = await this._HTTPAgent.post(`${config.url}/blockchain/${blockchainId}/gas-limit`, payload);
  //     console.debug(payload);
  //     if (response.success) {
  //       const { data } = response;
  //       this._gasLimit = Number(data['gasLimit']);
  //       console.warning(`_gasLimit: ${_gasLimit}`);
  //     } else {
  //       // TODO
  //       // _gasLimit = 21000;
  //       throw new Error(response.message);
  //     }
  //     return this._gasLimit;
  //   }
  // }

  // /**
  //  * getNonce
  //  * @override
  //  * @param {String} blockchainId
  //  * @param {String} address
  //  * @returns {Number} nonce
  // **/
  // getNonce() {
  //   const response = await this._HTTPAgent.get(`${config.url}/blockchain/${blockchainId}/address/${address}/nonce`);
  //   if (response.success) {
  //     const { data } = response;
  //     const nonce = Number(data['nonce']);
  //     this._nonce = nonce;
  //     return nonce;
  //   } else {
  //     // TODO:
  //     return this._nonce += 1;
  //   }
  // }
}

module.exports = EthereumService;
