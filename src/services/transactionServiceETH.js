const TransactionDecorator = require("./accountServiceDecorator");
const { ACCOUNT } = require("../models/account.model");
const Cryptor = require("../helpers/Cryptor");
const {  encodeToRlp, verifyEthereumAddress, getEthereumAddressBytes } = require('../helpers/ethereumUtils');
class TransactionServiceETH extends TransactionDecorator {
  service = null;
  _base = ACCOUNT.ETH;
  _currencyDecimals = 18;

  constructor(service) {
    this.service = service;
  }

  _signTransaction(transaction, privKey) {

    // TODO: 
    console.log("ETH from privKey: ", privKey);
    const payload = encodeToRlp(transaction);
    const rawDataHash = Buffer.from(Cryptor.keccak256round(payload, 1), "hex");
    const signature = Signer().sign(rawDataHash, privKey);
    console.log("ETH signature: ", signature);

    const chainIdV =
      transaction.chainId != null
        ? signature.v - 27 + (transaction.chainId * 2 + 35)
        : signature.v;
    signature = MsgSignature(signature.r, signature.s, chainIdV);
    transaction.signature = signature;
    return transaction;
  }

  /**
   * @override
   */
  verifyAddress() {
    const result = verifyEthereumAddress(address);
    return result;
  }

  /**
   * @override
   */
  extractAddressData() {
    return getEthereumAddressBytes(address);
  }

  /**
   * @override
   */
  prepareTransaction() {
    // const transaction = EthereumTransaction.prepareTransaction(
    //   from: changeAddress,
    //   to: to.contains(':') ? to.split(':')[1] : to,
    //   nonce: nonce,
    //   amount: amount, // in wei
    //   gasPrice: gasPrice, // in wei
    //   gasUsed: gasLimit,
    //   message: message,
    //   chainId: chainId,
    //   signature: MsgSignature(BigInt.zero, BigInt.zero, chainId),
    //   fee: gasLimit * gasPrice, // in wei
    // );
  
    return this._signTransaction(transaction, privKey);
  }
}

module.exports = TransactionServiceETH;
