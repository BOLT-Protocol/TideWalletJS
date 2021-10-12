const AccountServiceDecorator = require("./accountServiceDecorator");
const { ACCOUNT, ACCOUNT_EVT } = require("../models/account.model");
const UnspentTxOut = require("../models/utxo.model");
const { SegwitType } = require("../models/transactionBTC.model");
const SafeMath = require("../helpers/SafeMath");

class BitcoinService extends AccountServiceDecorator {
  constructor(AccountCore, TideWalletCommunicator, DBOperator) {
    super(AccountCore);
    this._base = ACCOUNT.BTC;
    this._syncInterval = 600 * 1000;

    this._numberOfUsedExternalKey = null;
    this._numberOfUsedInternalKey = null;
    this._fee = null;
    this._feeTimestamp = null;

    this._TideWalletCommunicator = TideWalletCommunicator;
    this._DBOperator = DBOperator;
  }

  /**
    @override
  **/
  async start() {
    await this.synchro(true);

    this.timer = setInterval(() => {
      this.synchro();
    }, this._syncInterval);
  }

  /**
   * getReceivingAddress
   * @override
   * @param {String} accountId
   * @returns {Array.<{address: String || error, code: Number}>} result
   */
  async getReceivingAddress(accountId) {
    try {
      const response = await this._TideWalletCommunicator.AccountReceive(
        accountId
      );
      const address = response["address"];
      this._numberOfUsedExternalKey = response["key_index"];
      return address;
    } catch (error) {
      console.log(error);
      // ++ Throw exception 0712
    }
  }

  /**
   * getChangingAddress
   * @override
   * @param {String} accountId
   * @returns {{address: String || error, code: Number}[]} result
   */
  async getChangingAddress(accountId) {
    try {
      const response = await this._TideWalletCommunicator.AccountChange(
        accountId
      );
      const address = response["address"];
      this._numberOfUsedInternalKey = response["key_index"];
      return [address, this._numberOfUsedInternalKey];
    } catch (error) {
      console.log(error);
      //TODO
      return ["error", 0];
    }
  }

  /**
   *
   * @param {object} param
   * @param {Array<UnspentTxOut>} param.unspentTxOuts
   * @param {string} param.feePerByte
   * @param {string} param.amount
   * @param {Buffer} param.message
   */
  calculateTransactionVSize({ unspentTxOuts, feePerByte, amount, message }) {
    let unspentAmount = "0";
    let headerWeight;
    let inputWeight;
    let outputWeight;
    let fee;
    if (this.segwitType == SegwitType.nativeSegWit) {
      headerWeight = 3 * 10 + 12;
      inputWeight = 3 * 41 + 151;
      outputWeight = 3 * 31 + 31;
    } else if (this.segwitType == SegwitType.segWit) {
      headerWeight = 3 * 10 + 12;
      inputWeight = 3 * 76 + 210;
      outputWeight = 3 * 32 + 32;
    } else {
      headerWeight = 3 * 10 + 10;
      inputWeight = 3 * 148 + 148;
      outputWeight = 3 * 34 + 34;
    }
    let numberOfTxIn = 0;
    let numberOfTxOut = message != null ? 2 : 1;
    let vsize = 0; // 3 * base_size(excluding witnesses) + total_size(including witnesses)
    for (const utxo of unspentTxOuts) {
      if (utxo.locked) continue;
      numberOfTxIn += 1;
      unspentAmount = SafeMath.plus(unspentAmount, utxo.amount);
      vsize = Math.ceil(
        (headerWeight +
          inputWeight * numberOfTxIn +
          outputWeight * numberOfTxOut +
          3) /
          4
      );
      fee = SafeMath.mult(vsize, feePerByte);
      if (SafeMath.gte(unspentAmount, SafeMath.plus(amount, fee))) break;
    }
    // fee = SafeMath.mult(vsize, feePerByte);
    return vsize;
  }

  /**
   * getFeePerUnit
   * @override
   * @param {String} blockchainId
   * @returns {Object} result
   * @returns {string} result.slow
   * @returns {string} result.standard
   * @returns {string} result.fast
   */
  async getFeePerUnit(blockchainId) {
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
          slow,
          standard,
          fast,
        };
        this._feeTimestamp = Date.now();
      } catch (error) {
        console.log(error);
        // TODO fee = null 前面會出錯
      }
    }
    return this._fee;
  }

  feePerUnit(speed, feePerUnits) {
    switch (speed) {
      case "slow":
        return feePerUnits.slow;
      case "standard":
        return feePerUnits.standard;
      case "fast":
        return feePerUnits.fast;
      default:
        return feePerUnits.standard;
    }
  }

  async getTransactionFee({
    id,
    blockchainId,
    decimals,
    amount,
    message,
    speed,
  } = {}) {
    const feePerUnits = await this.getFeePerUnit(blockchainId, decimals);
    console.log("getTransactionFee", feePerUnits);
    const utxos = await this.getUnspentTxOut(id);
    console.log("getTransactionFee", utxos);
    const vsize = utxos.length
      ? this.calculateTransactionVSize({
          unspentTxOuts: utxos,
          feePerByte: this.feePerUnit(speed, feePerUnits),
          amount,
          message,
        })
      : 1;
    return { feePerUnit: { ...feePerUnits }, unit: vsize };
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
        hex: Buffer.from(transaction.serializeTransaction).toString("hex"),
      };
      console.log("publishTransaction", body);
      const response = await this._TideWalletCommunicator.PublishTransaction(
        blockchainId,
        body
      );
      _transaction.txid = response["txid"];
      _transaction.timestamp = Math.floor(Date.now() / 1000);
      _transaction.confirmations = 0;
      _transaction.inputs = transaction.inputs.map((input) => ({
        ...input
      }));
      _transaction.changeUtxo = {
        ...transaction.changeUtxo,
      };
      return [true, _transaction];
    } catch (error) {
      console.log(error);
      return [false, _transaction];
    }
  }

  async _syncUTXO(force = false) {
    const now = Date.now();

    if (now - this.lastSyncUtxoTimestamp > this._syncInterval || force) {
      try {
        const response = await this._TideWalletCommunicator.GetUTXO(this.accountId);
        const datas = response;
        const utxos = datas.map((data) =>
          this._DBOperator.utxoDao.entity({
            ...data,
            accountId: this.accountId,
          })
        );
        await this._DBOperator.utxoDao.insertUtxos(utxos);
        this.lastSyncUtxoTimestamp = now;
      } catch (error) {
        console.trace(error);
      }
    } else {
      // TODO
    }
  }

  async getUnspentTxOut(accountId, decimals) {
    const utxos = await this._DBOperator.utxoDao.findAllUtxos(accountId);
    return utxos.map((utxo) => {
      utxo.decimals = decimals;
      const result = UnspentTxOut.fromUtxoEntity(utxo);
      return result;
    });
  }

  /**
   * updateUTXO
   * @override
   * @param {String} currencyId
   * @param {Object} data
   * @returns {Object} currency table object
   */
  async updateUTXO(currencyId, data) {
    // List<UtxoEntity> utxos =
    //     data.map((data) => UtxoEntity.fromJson(currencyId, data)).toList();
    // return DBOperator().utxoDao.insertUtxos(utxos);
  }

  /**
   * @override
   **/
  async synchro(force = false) {
    await super.synchro(force);
    await this._syncUTXO(force);
  }
}

module.exports = BitcoinService;
