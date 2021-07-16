const AccountServiceDecorator = require("./accountServiceDecorator");
const { ACCOUNT, ACCOUNT_EVT } = require("../models/account.model");
const UnspentTxOut = require("../models/utxo.model");
const BigNumber = require("bignumber.js");
const { SegwitType } = require("../models/transactionBTC.model");

class BitcoinService extends AccountServiceDecorator {
  constructor(service, TideWalletCommunicator, DBOperator) {
    super();
    this.service = service;
    this._base = ACCOUNT.BTC;
    this._syncInterval = 10 * 60 * 1000;

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
   * @param {String} accountcurrencyId
   * @returns {Array.<{address: String || error, code: Number}>} result
   */
  async getReceivingAddress(accountcurrencyId) {
    try {
      const response = await this._TideWalletCommunicator.AccountReceive(
        accountcurrencyId
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
   * @param {String} accountcurrencyId
   * @returns {{address: String || error, code: Number}[]} result
   */
  async getChangingAddress(accountcurrencyId) {
    try {
      const response = await this._TideWalletCommunicator.AccountChange(
        accountcurrencyId
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
   * @param {BigNumber} param.feePerByte
   * @param {BigNumber} param.amount
   * @param {Buffer} param.message
   */
  calculateTransactionVSize({ unspentTxOuts, amount, message }) {
    let unspentAmount = new BigNumber(0);
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
      unspentAmount = unspentAmount.plus(utxo.amount);
      vsize = Math.ceil(
        (headerWeight +
          inputWeight * numberOfTxIn +
          outputWeight * numberOfTxOut +
          3) /
          4
      );
      // fee = new BigNumber(vsize).multipliedBy(feePerByte);
      if (unspentAmount.gte(amount.plus(fee))) break;
    }
    // fee = new BigNumber(vsize).multipliedBy(feePerByte);
    return vsize; // ++ what[Tzuhan] why[Wayne]??
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

  async getTransactionFee(id, blockchainId, decimals, to, amount, message) {
    const feePerUnit = await this.getFeePerUnit(blockchainId, decimals);
    console.log("getTransactionFee", feePerUnit);
    const utxos = await this.getUnspentTxOut(id);
    console.log("getTransactionFee", utxos);
    const vsize = utxos.length
      ? this.calculateTransactionVSize(utxos, amount, message)
      : 1;
    return { feePerUnit: { ...feePerUnit }, unit: vsize };
  }

  /**
   * publishTransaction
   * @override
   * @param {String} blockchainId
   * @param {Transaction} transaction
   * @returns {Array.<{success: Boolean, transaction: String}>} result
   */
  async publishTransaction(blockchainId, transaction) {
    // APIResponse response = await HTTPAgent().post(
    //     '${Endpoint.url}/blockchain/$blockchainId/push-tx',
    //     {"hex": hex.encode(transaction.serializeTransaction)});
    // bool success = response.success;
    // BitcoinTransaction _transaction;
    // if (success) {
    //   // updateUsedUtxo
    //   _transaction = transaction;
    //   _transaction.id = response.data['txid'];
    //   _transaction.txId = response.data['txid'];
    //   _transaction.timestamp = DateTime.now().millisecondsSinceEpoch ~/ 1000;
    //   _transaction.confirmations = 0;
    //   _transaction.message = transaction.message ?? Uint8List(0);
    //   _transaction.direction =
    //       transaction.direction ?? TransactionDirection.sent;
    //   _transaction.status = transaction.status ?? TransactionStatus.pending;
    //   transaction.inputs.forEach((Input input) async {
    //     UnspentTxOut _utxo = input.utxo;
    //     _utxo.locked = true;
    //     await DBOperator()
    //         .utxoDao
    //         .insertUtxo(UtxoEntity.fromUnspentUtxo(_utxo));
    //   });
    //   // insertChangeUtxo
    //   if (transaction.changeUtxo != null) {
    //     Log.debug('changeUtxo txId: ${transaction.changeUtxo.txId}');
    //     await DBOperator()
    //         .utxoDao
    //         .insertUtxo(UtxoEntity.fromUnspentUtxo(transaction.changeUtxo));
    //     Log.debug('changeUtxo amount: ${transaction.changeUtxo.amount}');
    //   }
    //   // backend will parse transaction and insert changeUtxo to backend DB
    // }
    // return [success, _transaction]; // TODO return transaction
  }

  async _syncUTXO(force = false) {
    const now = Date.now();

    if (now - this.service.lastSyncTimestamp > this._syncInterval || force) {
      console.log("_syncUTXO");
      const accountId = this.service.accountId;
      console.log("_syncUTXO currencyId:", accountId);

      try {
        const response = await this._TideWalletCommunicator.GetUTXO(accountId);
        const datas = response;
        const utxos = datas.map((data) =>
          this._DBOperator.utxoDao.entity({
            ...data,
            accountId,
          })
        );
        await this._DBOperator.utxoDao.insertUtxos(utxos);
      } catch (error) {
        console.trace(error);
      }
    } else {
      // TODO
    }
  }

  async getUnspentTxOut(accountId) {
    const utxos = await this._DBOperator.utxoDao.findAllUtxos(accountId);
    return utxos.map((utxo) => UnspentTxOut.fromUtxoEntity(utxo));
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
    this.service.synchro(force);
    this._syncUTXO(force);
  }
}

module.exports = BitcoinService;
