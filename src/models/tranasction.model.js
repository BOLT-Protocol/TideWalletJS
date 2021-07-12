/**
 * @abstract
 * @property {string} id                    The transaction id
 * @property {string} direction             The direction
 * @property {BigNumber} amount             The amount
 * @property {string} status                The transaction status
 * @property {number} confirmations         The confirmations number
 * @property {string} address               The address is to or from address depending on direction
 * @property {BigNumber} fee                The fee
 * @property {string} txId                  The txId from API
 * @property {string} message               The transaction message
 * @property {string} sourceAddresses       The source addresses
 * @property {string} destinationAddresses  The destination addresses
 * @property {BigNumber} gasPrice           The gas price
 * @property {BigNumber} gasUsed            The gase used/limit
 */
class Transaction {
  id;
  direction;
  amount;
  status;
  timestamp;
  confirmations;
  address;
  fee;
  txId;
  message;
  sourceAddresses;
  destinationAddresses;
  gasPrice;
  gasUsed;

  constructor(values) {
    Object.assign(this, values);
  }

  serializeTransaction() {}

  static createTransaction() {
    console.log('createTransaction Transaction Model')
  }
}

const TRANSACTION_STATUS = {
  success: "success",
  fail: "fail",
  pending: "pending",
};

const TRANSACTION_DIRECTION = {
  sent: "sent",
  received: "received",
  moved: "moved",
  unknown: "unknown",
};

const TRANSACTION_PRIORITY = {
  slow: "slow",
  standard: "standard",
  fast: "fast",
};

/**
 * @property {number} v
 * @property {BigNumber} r
 * @property {BigNumber} s
 */
class Signature {
  constructor({ v, r, s }) {
    this.v = v;
    this.r = r;
    this.s = s;
  }
}

module.exports = {
  Transaction,
  TRANSACTION_STATUS,
  TRANSACTION_DIRECTION,
  TRANSACTION_PRIORITY,
  Signature,
};
