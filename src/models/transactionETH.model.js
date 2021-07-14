const {
  Transaction,
  TRANSACTION_DIRECTION,
  TRANSACTION_STATUS,
  Signature,
} = require("./tranasction.model");
const { encodeToRlp } = require("../helpers/ethereumUtils");
const BigNumber = require('bignumber.js');

class ETHTransaction extends Transaction {
  nonce;
  signature;
  chainId

  constructor(values) {
    super(values);
    console.log("ETHTRANSACTION", values)
    this.nonce = values.nonce;
    this.signature = values.signature;
    this.chainId = values.chainId;
  }

  serializeTransaction() {
    return encodeToRlp(this);
  }

  static createTransaction({
    from,
    to,
    amount,
    gasPrice,
    gasUsed,
    fee,
    message,
    chainId,
    nonce,
  }) {
    console.log("createTransaction", amount)
    console.log("createTransaction", gasPrice)
    console.log("createTransaction", gasUsed)
    console.log("createTransaction", fee)
    return new ETHTransaction({
      amount: BigNumber(amount),
      gasPrice: BigNumber(gasPrice),
      gasUsed,
      fee,
      message,
      chainId,
      direction: TRANSACTION_DIRECTION.sent,
      status: TRANSACTION_STATUS.pending,
      destinationAddresses: to,
      sourceAddresses: from,
      nonce,
      signature: new Signature({
        v: chainId,
        r: BigNumber(0),
        s: BigNumber(0),
      }),
    });
  }
}

module.exports = ETHTransaction;
