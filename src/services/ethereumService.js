const AccountServiceDecorator = require("./accountServiceDecorator");
const { ACCOUNT, ACCOUNT_EVT } = require("../models/account.model");
const SafeMath = require("../helpers/SafeMath");
const { toBuffer, pad, intToHex } = require("../helpers/utils");
const Cryptor = require("../helpers/Cryptor");

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

    await this.synchro(true);

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
        this._fee = response;
        console.log("getGasPrice fee in Eth", this._fee);
        this._feeTimestamp = Date.now();
      } catch (error) {
        console.log(error);
        throw error;
      }
    }
    return this._fee;
  }

  tokenTxMessage({ to, amount, decimals, message }) {
    const erc20Func = Cryptor.keccak256round(
      toBuffer("transfer(address,uint256)").toString("hex"),
      1
    ).slice(0, 8);
    console.log("tokenTxMessage amount", amount);
    amount = amount ?? "0";
    console.log("tokenTxMessage amount", amount);
    console.log("tokenTxMessage to", to);
    to = to ?? "";
    console.log("tokenTxMessage to", to);
    message = `0x${erc20Func}${pad(toBuffer(to).toString("hex"), 64)}${pad(
      toBuffer(
        Number.parseFloat(SafeMath.toSmallestUint(amount, decimals))
      ).toString("hex"),
      64
    )}${toBuffer(message).toString("hex")}`;
    return message;
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
    console.log("estimateGasLimit amount", amount);
    if (!to) return 21000;
    const from = await this.getReceivingAddress(id);
    if (message === "0x" && amount === "0" && this._gasLimit != null) {
      // if (message == "0x" && this._gasLimit != null) {
      return this._gasLimit;
    } else {
      const payload = {
        fromAddress: from,
        toAddress: to,
        value: intToHex(amount),
        data: message,
      };
      console.log("estimateGasLimit payload", payload);
      try {
        const response = await this._TideWalletCommunicator.GetGasLimit(
          blockchainId,
          payload
        );
        console.log("estimateGasLimit response", response);
        this._gasLimit = Number(response.gasLimit);
      } catch (error) {
        console.log("estimateGasLimit error", error);
        return 90000;
      }
      return this._gasLimit;
    }
  }

  async getTransactionFee({
    id,
    blockchainId,
    decimals,
    to,
    amount,
    message,
  } = {}) {
    const gasPrice = await this.getGasPrice(blockchainId, decimals);
    const gasLimit = await this.estimateGasLimit(
      id,
      blockchainId,
      to,
      SafeMath.ethToGwei(amount), // ??
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
    const _transaction = { ...transaction };
    console.log(_transaction); //-- debug info
    try {
      const body = {
        hex:
          "0x" +
          Buffer.from(transaction.serializeTransaction()).toString("hex"),
      };
      console.log("publishTransaction body", body);
      const response = await this._TideWalletCommunicator.PublishTransaction(
        blockchainId,
        body
      );
      console.log("publishTransaction response", response);
      _transaction.txid = response["txid"];
      _transaction.timestamp = Math.floor(Date.now() / 1000);
      _transaction.confirmations = 0;
      return [true, _transaction];
    } catch (error) {
      console.log(error);
      return [false, _transaction];
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
  async synchro(force = false) {
    await this.service.synchro(force);
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
