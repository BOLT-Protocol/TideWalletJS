const SafeMath = require('../helpers/SafeMath');
const { BitcoinTransactionType } = require('../models/transactionBTC.model');
const Entity = require('../database/entity');

class UnspentTxOut {
  id;
  accountId;
  txid;
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
    accountId,
    txid,
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
    this.accountId = accountId;
    this.txid = txid;
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
    accountId,
    txid,
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
      accountId,
      txid,
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
      accountId: utxo.accountId,
      txid: utxo.txid,
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

  toUtxoEntity() {
    return Entity.UtxoDao({
      accountId: this.accountId,
      txid: this.txid,
      vout: this.vout,
      type: this.type,
      amount: this.amountInSmallestUint,
      change_index: this.changeIndex,
      key_index: this.keyIndex,
      script: this.script.toString("hex"),
      timestamp: this.timestamp,
      address: this.address,
      locked: this.locked,
    })
  }
}

module.exports = UnspentTxOut;
