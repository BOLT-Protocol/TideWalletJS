const AccountServiceDecorator = require("./accountServiceDecorator");
const { ACCOUNT } = require("../models/account.model");
const HTTPAgent = require("../helpers/httpAgent");
const config = require("../constants/config");
const DBOperator = require("../database/dbOperator");
class EthereumService extends AccountServiceDecorator {
  constructor(service) {
    super();
    this.service = service;
    this._base = ACCOUNT.ETH;
    this._syncInterval = 15000;

    this._address = null;
    this._fee = null;
    this._gasLimit = null;
    this._feeTimestamp = null;
    this._nonce = 0;

    this._HTTPAgent = new HTTPAgent();
    this._DBOperator = new DBOperator();
  }

  /**
    @override
  **/
  init(accountId, base, interval) {
    this.service.init(
      accountId,
      base || this._base,
      interval !== this._syncInterval ? interval : this._syncInterval
    );
  }

  /**
    @override
  **/
  async start() {
    console.log("ETH Service Start", this._accountId, this._syncInterval);
    await this.service.start();

    this.synchro();

    this.service.timer = setInterval(() => {
      this.synchro();
    }, this._syncInterval);
  }

  /**
    @override
  **/
  stop() {
    this.service.stop();
  }

  /**
   * getReceivingAddress
   * @override
   * @param {String} currencyId
   * @returns {Array.<{address: String || error, code: Number}>} result
   **/
  async getReceivingAddress(currencyId) {
    if (this._address === null) {
      const response = await this._HTTPAgent.get(
        `${config.url}/wallet/account/address/${currencyId}/receive`
      );
      if (response.success) {
        const data = response["data"];
        const address = data["address"];
        this._address = address;

        return [this._address, null];
      } else {
        //TODO
        return ["error", 0];
      }
    }
    return [this._address, null];
  }

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
  async getTransactionFee(blockchainId) {
    if (
      this._fee == null ||
      Math.floor(new Date() / 1000) - this._feeTimestamp >
        this.AVERAGE_FETCH_FEE_TIME
    ) {
      const response = await this._HTTPAgent.get(
        `${config.url}/blockchain/${blockchainId}/fee`
      );
      if (response.success) {
        const { data } = response; // FEE will return String
        const { slow, standard, fast } = data;
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

  /**
   * publishTransaction
   * @override
   * @param {String} blockchainId
   * @param {Transaction} transaction
   * @returns {Array.<{success: Boolean, transaction: String}>} result
   **/
  async publishTransaction(blockchainId, transaction) {
    const response = await this._HTTPAgent.post(
      `${config.url}/blockchain/${blockchainId}/push-tx`,
      {
        hex:
          "0x" + new Buffer(transaction.serializeTransaction).toString("hex"),
      }
    );
    const { success, data } = response;
    // transaction.id = response.data['txid'];
    transaction.txId = data["txid"];
    transaction.timestamp = Math.floor(new Date() / 1000);
    transaction.confirmations = 0;
    return [success, transaction];
  }

  /**
   * updateTransaction
   * @override
   * @param {String} currencyId
   * @param {Object} payload
   * @returns {Object} transaction table object
   **/
  async updateTransaction(currencyId, payload) {
    return await this.service.updateTransaction(currencyId, payload);
  }

  /**
   * updateCurrency
   * @override
   * @param {String} currencyId
   * @param {Object} payload
   * @returns {Object} currency table object
   **/
  async updateCurrency(currencyId, payload) {
    return await this.service.updateCurrency(currencyId, payload);
  }

  /**
   * @override
   **/
  synchro() {
    this.service.synchro();
  }

  /**
   * addToken
   * @override
   * @param {String} blockchainId
   * @param {Object} token
   * @returns {Boolean} result
   **/
  async addToken(blockchainId, token) {
    const res = await this._HTTPAgent.post(
      `${config.url}/wallet/blockchain/${blockchainId}/contract/${token.contract}`,
      {}
    );
    if (res.success == false) return false;

    try {
      const { token_id: id } = res.data;
      const updateResult = await this._HTTPAgent.get(
        `${config.url}/wallet/account/${this.service.accountId}`
      );

      if (updateResult.success) {
        const accountItem = updateResult.data;
        const tokens = [accountItem, ...accountItem.tokens];
        const index = tokens.findIndex((token) => token["token_id"] == id);

        const data = {
          ...tokens[index],
          icon: token.imgUrl || accountItem["icon"],
          currency_id: id,
        };

        const curr = this._DBOperator.currencyDao.entity({
          ...data,
        });
        await this._DBOperator.currencyDao.insertCurrency(curr);

        const now = Date.now();
        const v = this._DBOperator.accountCurrencyDao.entity({
          ...tks[index],
          account_id: this.service.accountId,
          currency_id: id,
        });

        AccountCurrencyEntity.fromJson(tks[index], this.service.accountId, now);

        await this._DBOperator.accountCurrencyDao.insertAccount({
          token: tokens[index],
          accountId: this.service.accountId,
          last_sync_time: now,
        });

        const findAccountCurrencies =
          await this._DBOperator.accountCurrencyDao.findJoinedByAccountId(
            this.service.accountId
          );

        // List<Currency> cs = findAccountCurrencies
        //     .map((c) => Currency.fromJoinCurrency(c, jcs[0], this.base))
        //     .toList();

        // TODO: messenger
        // const msg = AccountMessage(evt: ACCOUNT_EVT.OnUpdateAccount, value: cs[0]);
        // this.service.AccountCore().currencies[this.service.accountId] = cs;

        const currMsg = {
          evt: ACCOUNT_EVT.OnUpdateCurrency,
          value: this.service.AccountCore().currencies[this.service.accountId],
        };

        this.service.AccountCore().messenger.next(currMsg);

        return true;
      } else {
        return false;
      }
    } catch (e) {
      console.error(e);

      return false;
    }
  }

  /**
   * estimateGasLimit
   * @override
   * @param {String} blockchainId
   * @param {String} from
   * @param {String} to
   * @param {String} amount
   * @param {String} message
   * @returns {Boolean} result
   **/
  async estimateGasLimit(blockchainId, from, to, amount, message) {
    if (message == "0x" && this._gasLimit != null) {
      return this._gasLimit;
    } else {
      const payload = {
        fromAddress: from,
        toAddress: to,
        value: amount,
        data: message,
      };
      const response = await this._HTTPAgent.post(
        `${config.url}/blockchain/${blockchainId}/gas-limit`,
        payload
      );
      if (response.success) {
        const { data } = response;
        this._gasLimit = Number(data.gasLimit);
      } else {
        // TODO
        // _gasLimit = 21000;
        throw new Error(response.message);
      }
      return this._gasLimit;
    }
  }

  /**
   * getNonce
   * @override
   * @param {String} blockchainId
   * @param {String} address
   * @returns {Number} nonce
   **/
  async getNonce(blockchainId, address) {
    const response = await this._HTTPAgent.get(
      `${config.url}/blockchain/${blockchainId}/address/${address}/nonce`
    );
    if (response.success) {
      const { data } = response;
      const nonce = Number(data["nonce"]);
      this._nonce = nonce;
      return nonce;
    } else {
      // TODO:
      return (this._nonce += 1);
    }
  }
}

module.exports = EthereumService;
