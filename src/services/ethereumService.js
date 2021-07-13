const AccountServiceDecorator = require("./accountServiceDecorator");
const { ACCOUNT, ACCOUNT_EVT } = require("../models/account.model");
const BigNumber = require("bignumber.js");

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
    console.log(
      this.base,
      " Service Start ",
      this.accountId,
      this._syncInterval
    );

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
   * @param {String} id Account id
   * @returns {Array.<{address: String || error, code: Number}>} result
   */
  async getReceivingAddress(id) {
    if (!this._address) {
      try {
        const response = await this._TideWalletCommunicator.AccountReceive(id);
        const address = response["address"];
        this._address = address;
      } catch (error) {
        console.log(error);
        // ++ Throw exception 0712
      }
    }
    return this._address;
  }

  /**
   * getChangingAddress
   * @override
   * @param {String} id Account id
   * @returns {{address: String || error, code: Number}[]} result
   */
  async getChangingAddress(id) {
    return await this.getReceivingAddress(id);
  }

  _GWeiToWei(amount) {
    const bnAmount = new BigNumber(amount);
    const bnBase = new BigNumber(10);
    const bnDecimal = bnBase.exponentiatedBy(9);
    const wei = bnAmount.multipliedBy(bnDecimal).toFixed();
    return wei;
  }

  _WeiToGWei(amount) {
    const bnAmount = new BigNumber(amount);
    const bnBase = new BigNumber(10);
    const bnDecimal = bnBase.exponentiatedBy(9);
    const gwei = bnAmount.dividedBy(bnDecimal).toFixed();
    return gwei;
  }

  toCurrencyUint(amount, decimals) {
    return this.service.toCurrencyUint(amount, decimals);
  }

  toSmallestUint(amount, decimals) {
    return this.service.toSmallestUint(amount, decimals);
  }

  /**
   * getGasPrice
   * @override
   * @param {blockchainId} string
   * @param {decimals} integer
   * @returns {Object} result
   * @returns {string} result.slow
   * @returns {string} result.standard
   * @returns {string} result.fast
   */
  async getGasPrice(blockchainId, decimals) {
    if (
      this._fee == null ||
      Date.now() - this._feeTimestamp > this.AVERAGE_FETCH_FEE_TIME
    ) {
      try {
        const response = await this._TideWalletCommunicator.GetFee(
          blockchainId
        );
        const { slow, standard, fast } = response;
        this._fee = {
          slow: this.service.toCurrencyUint(this._GWeiToWei(slow), decimals),
          standard: this.service.toCurrencyUint(
            this._GWeiToWei(standard),
            decimals
          ),
          fast: this.service.toCurrencyUint(this._GWeiToWei(fast), decimals),
        };
        this._feeTimestamp = Date.now();
      } catch (error) {
        console.log(error);
        // TODO fee = null 前面會出錯
      }
    }
    return this._fee;
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
   */
  async estimateGasLimit(id, blockchainId, to, amount = "0", message = "0x") {
    if (!to) return 21000;
    const from = await this.getReceivingAddress(id);
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
        const response = await this._TideWalletCommunicator.GetGasLimit(
          blockchainId,
          payload
        );
        this._gasLimit = Number(response.gasLimit);
      } catch (error) {
        throw error;
      }
      return this._gasLimit;
    }
  }

  async getTransactionFee(id, blockchainId, decimals, to, amount, message) {
    const gasPrice = await this.getGasPrice(blockchainId, decimals);
    const gasLimit = await this.estimateGasLimit(
      id,
      blockchainId,
      to,
      amount,
      message
    );
    return { feePerUnit: { ...gasPrice }, unit: gasLimit };
  }

  /**
   * publishTransaction
   * @override
   * @param {String} blockchainId
   * @param {Transaction} transaction
   * @returns {Array.<{success: Boolean, transaction: String}>} result
   */
  async publishTransaction(blockchainId, transaction) {
    try {
      const body = {
        hex:
          "0x" + Buffer.from(transaction.serializeTransaction).toString("hex"),
      };
      const response = await this._TideWalletCommunicator.PublishTransaction(
        blockchainId,
        body
      );
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
   */
  async updateTransaction(currencyId, payload) {
    return await this.service.updateTransaction(currencyId, payload);
  }

  /**
   * updateCurrency
   * @override
   * @param {String} currencyId
   * @param {Object} payload
   * @returns {Object} currency table object
   */
  async updateCurrency(currencyId, payload) {
    return await this.service.updateCurrency(currencyId, payload);
  }

  /**
   * @override
   **/
  synchro(force = false) {
    this.service.synchro(force);
  }

  /**
   * getNonce
   * @override
   * @param {String} blockchainId
   * @param {String} address
   * @returns {Number} nonce
   */
  async getNonce(blockchainId, address) {
    console.log("blockchainId", blockchainId);
    console.log("address", address);

    try {
      const response = await this._TideWalletCommunicator.GetNonce(
        blockchainId,
        address
      );
      console.log("response", response);
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
