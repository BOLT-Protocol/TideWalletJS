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
  to;
  signature;

  constructor(values) {
    super(values);
    this.nonce = values.nonce;
    this.to = values.to;
    this.signature = values.signature;
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
    message,
    chainId,
    fee,
    nonce,
  }) {
    // console.log("createTransaction ETHTransaction: ", ETHTransaction);
    console.log("createTransaction from: ", from);
    console.log("createTransaction to: ", to);
    console.log("createTransaction amount: ", amount);
    console.log("createTransaction gasPrice: ", gasPrice);
    console.log("createTransaction gasUsed: ", gasUsed);
    console.log("createTransaction nonce: ", nonce);
    console.log("createTransaction chainId: ", chainId);
    return new ETHTransaction({
      amount,
      gasPrice,
      gasUsed,
      message,
      chainId,
      direction: TRANSACTION_DIRECTION.sent,
      status: TRANSACTION_STATUS.pending,
      destinationAddresses: to,
      sourceAddresses: from,
      fee,
      nonce,
      to,
      signature: new Signature({
        v: chainId,
        r: BigNumber(0),
        s: BigNumber(0),
      }),
    });
  }
}

module.exports = ETHTransaction;
