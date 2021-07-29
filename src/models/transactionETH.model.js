const {
  Transaction,
  TRANSACTION_DIRECTION,
  TRANSACTION_STATUS,
  Signature,
} = require("./tranasction.model");
const { encodeToRlp } = require("../helpers/ethereumUtils");

class ETHTransaction extends Transaction {
  nonce;
  signature;

  constructor(values) {
    super(values);
    this.nonce = values.nonce;
    this.signature = values.signature;
  }

  serializeTransaction() {
    return encodeToRlp(this);
  }

  static createTransaction({
    from,
    to,
    amount,
    feePerUnit,
    gasUsed,
    fee,
    message,
    chainId,
    nonce,
  }) {
    return new ETHTransaction({
      amount,
      feePerUnit,
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
        r: 0,
        s: 0,
      }),
    });
  }
}

module.exports = ETHTransaction;
