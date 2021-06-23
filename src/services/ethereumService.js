const AccountServiceDecorator = require("./accountServiceDecorator");
const { ACCOUNT, ACCOUNT_EVT } = require("../models/account.model");

class EthereumService extends AccountServiceDecorator {
  constructor(service, TideWalletCommunicator, DBOperator) {
    super();
    this.service = service;
    this._base = ACCOUNT.ETH;
    this._syncInterval = 15000;

    this._address = null;
    this._fee = null;
    this._gasLimit = null;
    this._feeTimestamp = null;
    this._nonce = 0;

    this._TideWalletCommunicator = TideWalletCommunicator;
    this._DBOperator = DBOperator;
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
    console.log(this._base, " Service Start ", this.accountId, this._syncInterval);
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
   * @param {String} accountcurrencyId
   * @returns {Array.<{address: String || error, code: Number}>} result
   **/
  async getReceivingAddress(accountcurrencyId) {
    if (this._address === null) {
      try {
        const response = await this._TideWalletCommunicator.AccountReceive(accountcurrencyId);
        const address = response["address"];
        this._address = address;
      } catch (error) {
        console.log(error)
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
      Date.now() - this._feeTimestamp >
        this.AVERAGE_FETCH_FEE_TIME
    ) {
      try {
        const response = await this._TideWalletCommunicator.GetFee(blockchainId);
        const { slow, standard, fast } = response;
        this._fee = {
          slow,
          standard,
          fast,
        };
        this._feeTimestamp = Date.now();
      } catch (error) {
        console.log(error)
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
    try {
      const body = {
        hex:
          "0x" + Buffer.from(transaction.serializeTransaction).toString("hex"),
      }
      const response = await this._TideWalletCommunicator.PublishTransaction(blockchainId, body);
      transaction.txId = response["txid"];
      transaction.timestamp = Date.now();
      transaction.confirmations = 0;
      return [true, transaction];
    } catch (error) {
      console.log(error);
      return [false, transaction];
    }
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
    try {
      const res = await this._TideWalletCommunicator.TokenRegist(blockchainId, token.contract);
      const { token_id: id } = res;
      const updateResult = await this._TideWalletCommunicator.AccountDetail(this.service.accountId);

      const accountItem = updateResult;
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
        ...tokens[index],
        account_id: this.service.accountId,
        currency_id: id,
        last_sync_time: now,
      });

      await this._DBOperator.accountCurrencyDao.insertAccount(v);

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
      try {
        const response = await this._TideWalletCommunicator.GetGasLimit(blockchainId, payload);
        this._gasLimit = Number(response.gasLimit);
      } catch (error) {
        // TODO
        // _gasLimit = 21000;
        throw error;
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
    try {
      const response = await this._TideWalletCommunicator.GetNonce(blockchainId, address);
      const nonce = Number(response["nonce"]);
      this._nonce = nonce;
      return nonce;
    } catch (error) {
      console.log(error);
      // TODO:
      return (this._nonce += 1);
    }
  }
}

module.exports = EthereumService;
