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

  constructor(service) {
    super();
    console.log("TransactionServiceETH");
    this.service = service;
    this._accountDecimals = this.service.accountDecimals;
    console.log(this._accountDecimals);
  }

  _signTransaction(transaction) {
    console.log(transaction);
    const payload = encodeToRlp(transaction);
    console.log(payload);

    const rawDataHash = Cryptor.keccak256round(payload.toString("hex"), 1);
    console.log(rawDataHash);

    this.signer = this.service.safeSigner(0, 0);

    const signature = this.signer.sign({ data: "0x" + rawDataHash });
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
   * @param {string} param.amount
   * @param {string} param.gasPrice
   * @param {string} param.gasUsed
   * @param {string} param.message
   * @param {number} param.chainId
   * @param {number} param.nonce
   * @returns {ETHTransaction} transaction
   */
  prepareTransaction({
    from,
    to,
    amount,
    feePerUnit,
    feeUnit,
    fee,
    message,
    chainId,
    nonce,
  }) {
    const transaction = EthereumTransaction.createTransaction({
      from,
      to,
      amount,
      gasPrice: feePerUnit,
      gasUsed: feeUnit,
      fee,
      message,
      chainId,
      nonce,
    });
    return this._signTransaction(transaction);
  }
}

module.exports = TransactionServiceETH;
