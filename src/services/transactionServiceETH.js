const TransactionDecorator = require("./accountServiceDecorator");
const { ACCOUNT } = require("../models/account.model");
const Cryptor = require("../helpers/Cryptor");
const {
  encodeToRlp,
  verifyEthereumAddress,
  getEthereumAddressBytes,
} = require("../helpers/ethereumUtils");
const EthereumTransaction = require("../models/transactionETH.model");
const { Signature } = require("../models/tranasction.model");
const BigNumber = require("bignumber.js");

class TransactionServiceETH extends TransactionDecorator {
  service = null;
  _base = ACCOUNT.ETH;

  constructor(service, signer) {
    super();
    console.log("TransactionServiceETH")

    this.service = service;
    this.signer = signer;
    this._currencyDecimals = this.service.currencyDecimals;
    console.log(this._currencyDecimals)
  }

  _signTransaction(transaction) {
    const payload = encodeToRlp(transaction);
    console.log(payload);

    const rawDataHash = Buffer.from(
      Cryptor.keccak256round(payload.toString("hex"), 1),
      "hex"
    );
    console.log(rawDataHash);

    const signature = this.signer.sign({ data: rawDataHash });
    console.log("ETH signature: ", signature);

    const chainIdV =
      transaction.chainId != null
        ? signature.v - 27 + (transaction.chainId * 2 + 35)
        : signature.v;
    signature = Signature({
      v: chainIdV,
      r: signature.r,
      s: signature.s,
    });
    console.log(chainIdV);

    transaction.signature = signature;
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
   */
  verifyAddress(address) {
    console.log("address", address);
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
   * @method prepareTransaction
   * @param {object} param
   * @param {string} param.to
   * @param {BigNumber} param.amount
   * @param {BigNumber} param.gasPrice
   * @param {BigNumber} param.gasUsed
   * @param {stringm} param.message
   * @param {number} param.chainId
   * @param {number} param.nonce
   * @returns {ETHTransaction} transaction
   */
  prepareTransaction({
    from,
    to,
    amount,
    gasPrice,
    gasUsed,
    message,
    chainId,
    nonce,
  }) {
    console.log("prepareTransaction from: ", from);
    console.log("prepareTransaction to: ", to);
    console.log("prepareTransaction amount: ", amount);
    console.log("prepareTransaction gasPrice: ", gasPrice);
    console.log("prepareTransaction gasUsed: ", gasUsed);
    console.log("prepareTransaction nonce: ", nonce);
    console.log("prepareTransaction chainId: ", chainId);
    console.log(EthereumTransaction.createTransaction) 

    // =====================================
    // const fee = gasLimit.multipliedBy(gasPrice)
    console.log("prepareTransaction fee: ", fee);
    const transaction = EthereumTransaction.createTransaction({
      from,
      to,
      amount,
      gasPrice,
      gasUsed,
      message,
      chainId,
      fee,
      nonce,
    });
    console.log(transaction);
    return this._signTransaction(transaction, privKey);
  }
}

module.exports = TransactionServiceETH;
