const BigNumber = require("bignumber.js");

const TransactionDecorator = require("./accountServiceDecorator");
const { ACCOUNT } = require("../models/account.model");
const Cryptor = require("../helpers/Cryptor");
const { BitcoinTransaction, BitcoinTransactionType, SegwitType, HashType } = require("../models/transactionBTC.model");
const { Signature } = require("../models/tranasction.model");
const UnspentTxOut = require('../models/utxo.model');
const BitcoinUtils = require("../helpers/bitcoinUtils");
const rlp = require('../helpers/rlp');

class TransactionServiceBTC extends TransactionDecorator {
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

  constructor(service, signer, {segwitType}) {
    this.service = service;
    this.signer = signer;
    this.segwitType = segwitType;
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
  // _signTransaction(transaction) {
  //   console.log(`_unsignTransaction: ${transaction.serializeTransaction.toString('hex')}`);

  //   for (let index = 0; index < transaction.inputs.length; index++) {
  //     const rawData = transaction.getRawDataToSign(index);
  //     const rawDataHash = Cryptor.sha256round(rawData);
  //     const utxo = transaction.inputs[index].utxo;
  //     MsgSignature sig = Signer().sign(rawDataHash, utxo.privatekey);
  //     Uint8List buffer = new Uint8List(64);
  //     Log.btc('utxo txId: ${utxo.txId}');
  //     Log.btc('utxo.amount: ${utxo.amount}');

  //     buffer.setRange(0, 32, encodeBigInt(sig.r));
  //     buffer.setRange(32, 64, encodeBigInt(sig.s));
  //     Uint8List signature = Signer()
  //         .encodeSignature(buffer, transaction.inputs[index].hashType.value);
  //     transaction.inputs[index].addSignature(signature);
  //   }
  //   Uint8List signedTransaction = transaction.serializeTransaction;
  //   Log.btc('_signTransaction: $signedTransaction');
  //   Log.btc('_signTransaction hex: ${hex.encode(signedTransaction)}');
  //   return transaction;
  //   // const payload = encodeToRlp(transaction);
  //   // console.log(payload);

  //   // const rawDataHash = Buffer.from(
  //   //   Cryptor.keccak256round(payload.toString("hex"), 1),
  //   //   "hex"
  //   // );
  //   // console.log(rawDataHash);

  //   // const signature = this.signer.sign({ data: rawDataHash });
  //   // console.log("ETH signature: ", signature);

  //   // const chainIdV =
  //   //   transaction.chainId != null
  //   //     ? signature.v - 27 + (transaction.chainId * 2 + 35)
  //   //     : signature.v;
  //   // signature = Signature({
  //   //   v: chainIdV,
  //   //   r: signature.r,
  //   //   s: signature.s,
  //   // });
  //   // console.log(chainIdV);

  //   // transaction.signature = signature;
  //   // return transaction;
  // }

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
  prepareTransaction({
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
    const transaction = BitcoinTransaction.prepareTransaction({
      isMainNet,
      segwitType: this.segwitType,
      amount,
      fee,
      message
    });
    // to
    if (to.contains(':')) {
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
    const signedTransaction = this._signTransaction(transaction);

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
        changeIndex: _Index_InternalChain,
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
    } else if (isP2shAddress(
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
      Log.warning('unsupported Address');
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

  /**
   * 
   * @param {object} param
   * @param {Array<UnspentTxOut>} param.unspentTxOuts
   * @param {BigNumber} param.feePerByte
   * @param {BigNumber} param.amount
   * @param {Buffer} param.message
   */
  calculateTransactionVSize({
    unspentTxOuts,
    feePerByte,
    amount,
    message,
  }) {
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
    let vsize =
        0; // 3 * base_size(excluding witnesses) + total_size(including witnesses)
    for (const utxo of unspentTxOuts) {
      if (utxo.locked) continue;
      numberOfTxIn += 1;
      unspentAmount = unspentAmount.plus(utxo.amount);
      vsize = Math.ceil((headerWeight +
        (inputWeight * numberOfTxIn) +
        (outputWeight * numberOfTxOut) +
        3) / 4);
      fee = new BigNumber(vsize).multipliedBy(feePerByte);
      if (unspentAmount.gte(amount.plus(fee))) break;
    }
    fee = new BigNumber(vsize).multipliedBy(feePerByte);
    return fee; // ++ why??
  }

  

}

module.exports = TransactionServiceBTC;
