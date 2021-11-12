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

class TransactionServiceETH extends TransactionDecorator {
  service = null;
  _base = ACCOUNT.ETH;

  constructor(service, signer) {
    super();
    this.service = service;
    this.signer = signer;
  }

  async _signTransaction(transaction) {
    console.log(transaction);
    const payload = transaction.serializeTransaction();
    console.log(payload.toString("hex"));

    const rawDataHash = Buffer.from(
      Cryptor.keccak256round(payload.toString("hex"), 1),
      "hex"
    );

    console.log(rawDataHash); // -- debug info

    let signature = await this.signer.sign({ data: rawDataHash });
    console.log("ETH signature.v: ", signature.v); // -- debug info
    console.log("ETH signature transaction.chainId : ", transaction.chainId); // -- debug info

    const chainIdV =
      transaction.chainId != null
        ? signature.v - 27 + (transaction.chainId * 2 + 35)
        : signature.v;
    console.log("ETH signature chainIdV : ", chainIdV); // -- debug info
    signature = new Signature({
      v: chainIdV,
      r: signature.r,
      s: signature.s,
    });

    transaction.signature = signature;
    return transaction;
  }

  /**
   * @override
   */
  verifyAddress(address, isMainnet) {
    console.log("address", address);
    console.log("isMainnet", isMainnet);
    const result = verifyEthereumAddress(address);
    console.log("result", result);
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
   * @param {string} param.amount inSmallestUnit
   * @param {string} param.feePerUnit inSmallestUnit
   * @param {string} param.fee inCurrencyUnit
   * @param {number} param.gasUsed
   * @param {string} param.message
   * @param {number} param.chainId
   * @param {number} param.nonce
   * @returns {ETHTransaction} transaction
   */
  prepareTransaction({ transaction, chainId, nonce }) {
    const _transaction = EthereumTransaction.createTransaction({
      to: transaction.to,
      amount: transaction.amount,
      feePerUnit: transaction.feePerUnit,
      gasUsed: transaction.feeUnit,
      fee: transaction.fee,
      message: transaction.message,
      from: transaction.from,
      chainId,
      nonce,
    });
    return this._signTransaction(_transaction);
  }
}

module.exports = TransactionServiceETH;
