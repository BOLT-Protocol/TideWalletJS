const SafeMath = require('../helpers/SafeMath');
const { BitcoinTransactionType } = require('../models/transactionBTC.model');

class UnspentTxOut {
  id;
  accountcurrencyId;
  txId;
  vout;
  type;
  address;
  amount; // in currency uint
  changeIndex;
  keyIndex;
  data; // hex string
  timestamp;
  decimals;
  locked;
  sequence;

  //TEST
  // String scriptPubKey;
  publickey;

  get script() { return data };
  get hash() { return data };
  get signature() { return data };
  get amountInSmallestUint() {
    return SafeMath.toSmallestUint(this.amount, this.decimals);
  }

  constructor({
    id,
    accountcurrencyId,
    txId,
    vout,
    type,
    address,
    amount, // in currency uint
    changeIndex,
    keyIndex,
    data,
    timestamp,
    locked,
    sequence,
    decimals,
    // for transaction only
    publickey,
    // this.scriptPubKey,
  }) {
    this.id = id;
    this.accountcurrencyId = accountcurrencyId;
    this.txId = txId;
    this.vout = vout;
    this.type = type;
    this.address = address;
    this.amount = amount; // in currency uint
    this.changeIndex = changeIndex;
    this.keyIndex = keyIndex;
    this.data = data;
    this.timestamp = timestamp;
    this.locked = locked;
    this.sequence = sequence;
    this.decimals = decimals;
    // for transaction only
    this.publickey = publickey
    // this.scriptPubKey,
  }

  static fromSmallestUint({
    id,
    accountcurrencyId,
    txId,
    vout,
    type,
    address,
    amount,
    changeIndex,
    keyIndex,
    data,
    timestamp,
    locked,
    sequence,
    decimals,
    // for transaction only
    publickey,
    // this.scriptPubKey,
  }) {
    const cAmount = SafeMath.toCurrencyUint(amount, decimals);
    return new UnspentTxOut({
      id,
      accountcurrencyId,
      txId,
      vout,
      type,
      address,
      cAmount,
      changeIndex,
      keyIndex,
      data,
      timestamp,
      locked,
      sequence,
      decimals,
      // for transaction only
      publickey,
      // this.scriptPubKey,
    })
  };

  static fromUtxoEntity(utxo) {
    console.log('utxo.amount:', utxo.amount, typeof utxo.amount);
    console.log('utxo.decimals:', utxo.decimals, typeof utxo.decimals);
    return new UnspentTxOut({
      id: utxo.utxoId,
      accountcurrencyId: utxo.accountId,
      txId: utxo.txid,
      vout: utxo.vout,
      type: Object.values(BitcoinTransactionType).find((type) => type.value == utxo.type),
      amount: SafeMath.toCurrencyUint(utxo.amount, utxo.decimals),
      changeIndex: utxo.changeIndex,
      keyIndex: utxo.keyIndex,
      data: Buffer.from(utxo.script),
      timestamp: utxo.timestamp,
      locked: utxo.locked,
      address: utxo.address,
      decimals: utxo.decimals,
      sequence: utxo.sequence,
    });
  }
}

module.exports = UnspentTxOut;
