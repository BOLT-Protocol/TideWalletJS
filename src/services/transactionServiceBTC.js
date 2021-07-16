const BigNumber = require("bignumber.js");

const TransactionDecorator = require("./accountServiceDecorator");
const { ACCOUNT } = require("../models/account.model");
const Cryptor = require("../helpers/Cryptor");
const { BitcoinTransaction, BitcoinTransactionType, SegwitType, HashType } = require("../models/transactionBTC.model");
const { Signature } = require("../models/tranasction.model");
const UnspentTxOut = require('../models/utxo.model');
const BitcoinUtils = require("../helpers/bitcoinUtils");
const rlp = require('../helpers/rlp');
const Signer = require('../cores/Signer');

class TransactionServiceBTC extends TransactionDecorator {
  _Index_ExternalChain = 0;
  _Index_InternalChain = 1;

  service = null;
  _base = ACCOUNT.BTC;

  p2pkhAddressPrefixTestnet = 0x6F;
  p2pkhAddressPrefixMainnet = 0;
  p2shAddressPrefixTestnet = 0xC4;
  p2shAddressPrefixMainnet = 0x05;
  bech32HrpMainnet = 'bc';
  bech32HrpTestnet = 'tb';
  bech32Separator = '1';
  supportSegwit = true;
  segwitType = SegwitType.nativeSegWit;

  constructor(service, signer, option = {}) {
    super();
    this.service = service;
    this.signer = signer;
    this.segwitType = option.segwitType ? option.segwitType : SegwitType.nativeSegWit;
    this._currencyDecimals = this.service.currencyDecimals;
  }

  /**
   * @override
   * @param {string} address
   * @param {boolean} isMainNet
   */
   verifyAddress(address, isMainNet) {
    console.log("address", address);
    const verified = BitcoinUtils.isP2pkhAddress(
        address,
        isMainNet
          ? this.p2pkhAddressPrefixMainnet
          : this.p2pkhAddressPrefixTestnet) ||
      BitcoinUtils.isP2shAddress(
        address,
        isMainNet
          ? this.p2shAddressPrefixMainnet
          : this.p2shAddressPrefixTestnet) ||
      BitcoinUtils.isSegWitAddress(
        address,
        isMainNet ? this.bech32HrpMainnet : this.bech32HrpTestnet,
        bech32Separator); // TODO BitcoinCash Address condition
    return verified;
  }

  /**
   * 
   * @param {BitcoinTransaction} transaction 
   * @returns 
   */
  async _signTransaction(transaction) {
    console.log(`_unsignTransaction: ${transaction.serializeTransaction.toString('hex')}`);

    for (let index = 0; index < transaction.inputs.length; index++) {
      const rawData = transaction.getRawDataToSign(index);
      const rawDataHash = Cryptor.sha256round(rawData);
      const utxo = transaction.inputs[index].utxo;
      const sig = await this.signer.sign({
        data: rawDataHash,
        changeIndex: utxo.changeIndex,
        keyIndex: utxo.keyIndex
      });
      const buffer = Buffer.alloc(64, 0);
      console.log(`utxo txId: ${utxo.txId}`);
      console.log(`utxo.amount: ${utxo.amount.toFixed()}`);

      sig.r.copy(buffer, 0, 0, 32);
      sig.s.copy(buffer, 32, 0, 32);
      const signature = Signer
          .encodeSignature(buffer, transaction.inputs[index].hashType.value);
      transaction.inputs[index].addSignature(signature);
    }
    const signedTransaction = transaction.serializeTransaction;
    console.log(`_signTransaction: ${signedTransaction.toString('hex')}`);
    return transaction;
  }

  /**
   * @override
   */
  verifyAmount(balance, amount, fee) {
    // ++ TODO 2021/07/08
    console.log("balance", balance);
    console.log("amount", amount);
    console.log("fee", fee);
    return BigNumber(balance).isGreaterThanOrEqualTo(
      BigNumber(amount).plus(BigNumber(fee))
    );
  }

  /**
   * @override
   * @method prepareTransaction
   * @param {object} param
   * @param {Boolean} param.isMainNet
   * @param {string} param.to
   * @param {BigNumber} param.amount
   * @param {Buffer} param.message
   * @param {string} param.accountId
   * @param {BigNumber} param.fee
   * @param {Array<UnspentTxOut>} param.unspentTxOuts
   * @param {string} param.keyIndex
   * @param {string} param.changeAddress
   * @returns {ETHTransaction} transaction
   */
  async prepareTransaction({
    isMainNet,
    to,
    amount,
    message,
    accountId,
    fee,
    unspentTxOuts,
    keyIndex,
    changeAddress,
  }) {
    const transaction = BitcoinTransaction.createTransaction({
      isMainNet,
      segwitType: this.segwitType,
      amount,
      fee,
      message
    });
    // to
    if (to.includes(':')) {
      to = to.split(':')[1];
    }
    // output
    const result = this.extractAddressData(to, isMainNet);
    const script = this._addressDataToScript(result[0], result[1]);
    transaction.addOutput(amount, to, script);
    // input
    if (unspentTxOuts == null || unspentTxOuts.length == 0) return null;
    let utxoAmount = new BigNumber(0);
    for (const utxo of unspentTxOuts) {
      if (utxo.locked || !(new BigNumber(utxo.amount).gt(new BigNumber(0))) || utxo.type == null)
        continue;
      transaction.addInput(utxo, HashType.SIGHASH_ALL);
      utxoAmount = utxoAmount.plus(utxo.amountInSmallestUint);
    }
    if (transaction.inputs.length == 0 || utxoAmount.lt(amount.plus(fee))) {
      console.warn(`Insufficient utxo amount: $utxoAmount : ${amount.plus(fee).toFixed()}`);
      return null;
    }
    // change, changeAddress
    const change = utxoAmount.minus(amount).minus(fee);
    console.log(`prepareTransaction change: ${change.toFixed()}`);
    if (change.gt(new BigNumber(0))) {
      const result = this.extractAddressData(changeAddress, isMainNet);
      const script = this._addressDataToScript(result[0], result[1]);
      transaction.addOutput(change, changeAddress, script);
    }
    // Message
    const msgData = (message == null) ? [] : rlp.toBuffer(message);
    console.log(`msgData[${message.length}]: ${msgData}`);
    // invalid msg data
    if (msgData.length > 250) {
      // TODO BitcoinCash Address condition >220
      Log.warning('Invalid msg data: ${msgData.toString()}');
      return null;
    }
    if (msgData.length > 0) {
      transaction.addData(msgData);
    }
    const signedTransaction = await this._signTransaction(transaction);

    // Add ChangeUtxo
    if (change.gt(new BigNumber(0))) {
      const changeUtxo = UnspentTxOut.fromSmallestUint({
        id: signedTransaction.txId + "-1",
        accountcurrencyId: accountId,
        txId: signedTransaction.txId,
        vout: 1,
        type: this.segwitType == SegwitType.nativeSegWit
        ? BitcoinTransactionType.WITNESS_V0_KEYHASH
        : this.segwitType == SegwitType.segWit
          ? BitcoinTransactionType.SCRIPTHASH
          : BitcoinTransactionType.PUBKEYHASH,
        amount: change,
        changeIndex: this._Index_InternalChain,
        keyIndex: keyIndex,
        timestamp: Math.floor(Date.now() / 1000),
        locked: false,
        data: Buffer.alloc(1, 0),
        decimals: this.currencyDecimals,
        address: changeAddress
      });
      signedTransaction.addChangeUtxo(changeUtxo);
      console.log(`changeUtxo txid: ${signedTransaction.txId}`);
      console.log(`changeUtxo amount: ${change}`);
    }

    return signedTransaction;
    // console.log(transaction);
    // return this._signTransaction(transaction, privKey);
  }

  /**
   * 
   * @param {string} address 
   * @param {Boolean} isMainNet 
   * @returns {Array}
   */
  extractAddressData(address, isMainNet) {
    let data;
    let type;
    if (BitcoinUtils.isP2pkhAddress(
      address,
      isMainNet
        ? this.p2pkhAddressPrefixMainnet
        : this.p2pkhAddressPrefixTestnet)) {
      type = BitcoinTransactionType.PUBKEYHASH;
      data = BitcoinUtils.decodeAddress(address).slice(1);
    } else if (BitcoinUtils.isP2shAddress(
        address,
        isMainNet
            ? this.p2shAddressPrefixMainnet
            : this.p2shAddressPrefixTestnet)) {
      type = BitcoinTransactionType.SCRIPTHASH;
      data = BitcoinUtils.decodeAddress(address).slice(1);
    } else if (BitcoinUtils.isSegWitAddress(
        address,
        isMainNet ? this.bech32HrpMainnet : this.bech32HrpTestnet,
        this.bech32Separator)) {
      type = BitcoinTransactionType.WITNESS_V0_KEYHASH;
      data = BitcoinUtils.extractScriptPubkeyFromSegwitAddress(address);
    } else {
      // TODO BitcoinCash Address condition
      console.warn('unsupported Address');
    }
    return [type, data];
  }

  /**
   *  
   * @param {object} transactionType
   * @param {string} transactionType.value
   * @param {Buffer} data 
   * @returns {Buffer}
   */
  _addressDataToScript(transactionType, data) {
    let script;
    switch (transactionType) {
      case BitcoinTransactionType.PUBKEYHASH:
      case BitcoinTransactionType.PUBKEY:
        script = BitcoinUtils.toP2pkhScript(data);
        break;
      case BitcoinTransactionType.SCRIPTHASH:
        script = BitcoinUtils.toP2shScript(data);
        break;
      case BitcoinTransactionType.WITNESS_V0_KEYHASH:
        script = data;
        break;
      default:
        break;
    }
    return script;
  }

  // -- move to BitcoinService for getTransactionFee
}

module.exports = TransactionServiceBTC;
