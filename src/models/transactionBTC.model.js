const BigNumber = require('bignumber.js');

const Cryptor = require('../helpers/Cryptor');
const BitcoinUtils = require('../helpers/bitcoinUtils');
const {
  Transaction,
  TRANSACTION_DIRECTION,
  TRANSACTION_STATUS,
  Signature,
} = require("./tranasction.model");

const BitcoinTransactionType = {
  PUBKEYHASH: { value: 'pubkeyhash' },
  SCRIPTHASH: { value: 'scripthash' },
  WITNESS_V0_KEYHASH: { value: 'witness_v0_keyhash' },
  PUBKEY: { value: 'pubkey' },
}

const SegwitType = {
  nonSegWit: { value: 1, purpose: (0x80000000 | 44), name: 'Legacy' },
  segWit: { value: 2, purpose: (0x80000000 | 49), name: 'SegWit' },
  nativeSegWit: { value: 3, purpose: (0x80000000 | 84), name: 'Native SegWit' },
}

const HashType = {
  SIGHASH_ALL: { value: 0x01 },
  SIGHASH_NONE: { value: 0x02 },
  SIGHASH_SINGLE: { value: 0x03 },
  SIGHASH_ANYONECANPAY: { value: 0x80 },
}

class Input {
  /* hash of the Transaction whose output is being used */
  // Uint8List prevTxHash;
  /* used output's index in the previous transaction */
  // int vout;
  /* the signature produced to check validity */

  constructor(utxo, hashType) {
    this.utxo = utxo,
    this.publicKey = utxo.publickey,
    this.address = utxo.address;
    this.hashType = hashType;

    this.segwit = false;
  }

  get reservedTxId() {
    return Buffer.from(this.utxo.txId, 'hex').reverse();
  }

  get voutInBuffer() {
    const buf = Buffer.allocUnsafe(4);
    buf.writeUInt32LE(this.utxo.vout, 0);
    return buf;
  }

  get sequenceInBuffer() {
    const buf = Buffer.allocUnsafe(4);
    const sequence = this.utxo.sequence ? this.utxo.sequence : BitcoinTransaction.DEFAULT_SEQUENCE
    buf.writeUInt32LE(sequence, 0);
    return buf;
  }

  get amountInBuffer() {
    const amount = this.utxo.amountInSmallestUint.toString(16).padStart(8, '0');
    return Buffer.from(amount, 'hex').reverse();
  }

  get hashTypeInBuffer() {
    const buf = Buffer.allocUnsafe(4);
    buf.writeUInt32LE(this.hashType.value, 0);
    return buf;
  }

  /**
   * @param {Object} segwitType
   * @param {Number} segwitType.value
   * @param {Number} segwitType.purpose
   * @param {string} segwitType.name
   * @returns 
   */
  isSegwit(segwitType) {
    let segwit = false;
    if (this.utxo.type == BitcoinTransactionType.PUBKEYHASH) {
      // do nothing
    } else if (this.utxo.type == BitcoinTransactionType.SCRIPTHASH) {
      segwit = (segwitType == SegwitType.segWit);
    } else if (this.utxo.type == BitcoinTransactionType.WITNESS_V0_KEYHASH) {
      segwit = true;
    } else if (this.utxo.type == BitcoinTransactionType.PUBKEY) {
      // do nothing
    } else {
      Log.warning('Unusable this.utxo: ${this.utxo.txId}');
      return null;
    }
    this.segwit = segwit;
    return segwit;
  }

  /**
   * @param {Buffer} signature 
   */
  addSignature(signature) {
    let scriptSig;
    if (signature == null)
      scriptSig = null;
    else {
      const utxoType = this.utxo.type;
      switch (utxoType) {
        case BitcoinTransactionType.PUBKEYHASH:
          scriptSig = Buffer.from([
            signature.length,
            ...signature,
            this.publicKey.length,
            ...this.publicKey
          ]);
          break;
        case BitcoinTransactionType.SCRIPTHASH:
          scriptSig = Buffer.from([
            0x00,
            signature.length,
            ...signature,
            this.publicKey.length,
            ...this.publicKey
          ]);
          break;
        case BitcoinTransactionType.WITNESS_V0_KEYHASH:
          scriptSig = Buffer.from([
            0x02,
            signature.length,
            ...signature,
            this.publicKey.length,
            ...this.publicKey
          ]);
          break;
        case BitcoinTransactionType.PUBKEY:
          scriptSig = Buffer.from([
            signature.length,
            ...signature,
          ]);
          break;
      }
    }
  }
}

class Output {
  /**
   * @param {BigNumber} amount value in bitcoins of the output (inSatoshi)
   * @param {String} address the address or public key of the recipient
   * @param {Buffer} script 
   */
  constructor(amount, address, script) {
    this.amount = amount;
    this.address = address;
    this.script = script;
  }

  get amountInBuffer() {
    const amount = this.amount.toFixed().padStart(8, '0');
    return Buffer.from(amount, 'hex').reverse();
  }
}

class BitcoinTransaction extends Transaction {
  static ADVANCED_TRANSACTION_MARKER = 0x00;
  static ADVANCED_TRANSACTION_FLAG = 0x01;
  static DEFAULT_SEQUENCE = 0xffffffff;

  currencyId;

  _inputs;
  _outputs;
  _version;
  _lockTime;
  _segwitType;
  _changeUtxo;
  // bool _publish; //TODO get publish property from currency

  get inputs() { return this._inputs };
  get outputs() { return this._outputs };
  get changeUtxo() { return this._changeUtxo };

  constructor(values) {
    super(values);
    this.currencyId = values.currencyId;
    this.message = values.message ? values.message : Buffer.from('0', 'hex');

    this._segwitType = values.segwitType;
    this._inputs = [];
    this._outputs = [];
    this.setVersion(values.isMainNet ? 1 : 2);
    this.setlockTime(values.lockTime ? values.lockTime : 0);
  }

  static createTransaction({ isMainNet, segwitType,
    amount, fee, message, lockTime }) {
    return new BitcoinTransaction({
      segwitType: (segwitType ? segwitType : SegwitType.nativeSegWit),
      amount,
      fee,
      message,
      direction: TRANSACTION_DIRECTION.sent,
      status: TRANSACTION_STATUS.pending,
      destinationAddresses: '',
      sourceAddresses: '',
      lockTime,
      isMainNet,
      lockTime,
    });
  }

  setVersion(version) {
    this._version = Buffer.allocUnsafe(4);
    this._version.writeUInt32LE(version, 0);
  }

  setlockTime(locktime) {
    this._lockTime = Buffer.allocUnsafe(4);
    this._lockTime.writeUInt32LE(locktime, 0);
  }

  /**
   * 
   * @param {UnspentTxOut} changeUtxo 
   */
  addChangeUtxo(changeUtxo) {
    this._changeUtxo = changeUtxo;
  }

  /**
   * @param {UnspentTxOut} utxo  
   * @param {HashType} hashType 
   */
  addInput(utxo, hashType) {
    const input = new Input(utxo, hashType);
    this._inputs.push(input);
    if (!this.sourceAddresses.trim()) {
      this.sourceAddresses += utxo.address;
    } else {
      this.sourceAddresses += `, ${utxo.address}`;
    }
  }

  /**
   * @param {BigNumber} amount in smallest uint
   * @param {string} address 
   * @param {Array<number>} script
   */
  addOutput(amount, address, script) {
    if (script == null || script.length == 0) return null;
    let scriptLength = [];
    if (script.length < 0xFD) {
      scriptLength = [script.length];
    } else if (script.length <= 0xFFFF) {
      const scriptLengthData = Buffer.allocUnsafe(2);
      scriptLengthData.writeUInt32LE(script.length, 0);
      scriptLength = [0xFD, ...scriptLengthData];
    } else {
      Log.warning(' unsupported script length');
      return null;
    }
    const output = new Output(amount, address, Buffer.from([...scriptLength, ...script]));
    this._outputs.push(output);
    if (!this.destinationAddresses.trim()) {
      this.destinationAddresses += address;
    } else {
      this.destinationAddresses += `, ${address}`;
    }
  }

  /**
   * @param {Array<Number>} data 
   */
  addData(data) {
    const scriptLength = data.length + 2;
    const output = new Output(new BigNumber(0), '',
        Buffer.from([scriptLength, 0x6a, data.length, ...data]));
    this._outputs.push(output);
  }

  // ++ 邏輯怪怪的， rawDataToSign 應該要以this._segwitType為主，
  // ++ 如果是 segwit 所有的 rawDataToSign 就都是segwit
  // ++ 而不是根據選到的input
  /**
   * 
   * @param {Number} index 
   * @returns {Buffer}
   */
  getRawDataToSign(index) {
    const data = [];
    const selectedInput = this._inputs[index];
    if (selectedInput.isSegwit(this._segwitType)) {
      //  nVersion
      //  hashPrevouts
      //  hashSequence
      //  outpoint:     (32-byte hash + 4-byte little endian vout)
      //  scriptCode:   For P2WPKH witness program, the scriptCode is 0x1976a914{20-byte-pubkey-hash}88ac. //only compressed public keys are accepted in P2WPKH and P2WSH.
      //  amount:       value of the output spent by this input (8-byte little endian)
      //  nSequence:    ffffffff
      //  hashOutputs
      //  nLockTime:    11000000
      //  nHashType:    01000000 // SIGHASH_ALL

      const prevouts = [];
      const sequences = [];
      const outputs = [];
      for (const input of this._inputs) {
        prevouts.push(...input.reservedTxId, ...input.voutInBuffer);
        sequences.push(...input.sequenceInBuffer);
      }

      if (selectedInput.hashType != HashType.SIGHASH_SINGLE ||
          selectedInput.hashType != HashType.SIGHASH_NONE) {
            for (const output of this._outputs) {
              outputs.push(...output.amountInBuffer, ...output.script);
            }
      } else if (selectedInput.hashType == HashType.SIGHASH_SINGLE && index < this._outputs.length) {
        outputs.push(
          ...this._outputs[index].amountInBuffer, ...this._outputs[index].script);
      }

      const hashPrevouts = Cryptor.sha256round(Buffer.from(prevouts));
      const hashSequence = Cryptor.sha256round(Buffer.from(sequences));

      console.log('hashPrevouts:', hashPrevouts.toString('hex'));
      console.log('hashSequence:', hashSequence.toString('hex'));

      //  nVersion
      data.push(...this._version);
      //  hashPrevouts
      /* 
      If the ANYONECANPAY flag is not set, hashPrevouts is the double SHA256 of the serialization of all input outpoints;
      Otherwise, hashPrevouts is a uint256 of 0x0000......0000.
      */
      if (selectedInput.hashType != HashType.SIGHASH_ANYONECANPAY) {
        data.push(...hashPrevouts);
      } else {
        const buf = Buffer.alloc(32, 0);
        data.push(...buf);
      }

      //  hashSequence
      /* 
      If none of the ANYONECANPAY, SINGLE, NONE sighash type is set, hashSequence is the double SHA256 of the serialization of nSequence of all inputs;
      Otherwise, hashSequence is a uint256 of 0x0000......0000.
       */
      if (selectedInput.hashType == HashType.SIGHASH_ALL) {
        data.push(...hashSequence);
      } else {
        const buf = Buffer.alloc(32, 0);
        data.push(...buf);
      }
      //  outpoint:
      data.push(...selectedInput.reservedTxId, ...selectedInput.voutInBuffer);
      /*
      For P2WPKH witness program, the scriptCode is 0x1976a914{20-byte-pubkey-hash}88ac.
      For P2WSH witness program,
          if the witnessScript does not contain any OP_CODESEPARATOR, the scriptCode is the witnessScript serialized as scripts inside CTxOut.
          if the witnessScript contains any OP_CODESEPARATOR, the scriptCode is the witnessScript but removing everything up to and including 
          the last executed OP_CODESEPARATOR before the signature checking opcode being executed, serialized as scripts inside CTxOut. 
          (The exact semantics is demonstrated in the examples below)
       */
      //  scriptCode:
      let scriptCode =
        BitcoinUtils.toP2pkhScript(BitcoinUtils.toPubKeyHash(selectedInput.publicKey));
      console.log('prevOutScript:', Buffer.from([scriptCode.length, ...scriptCode]).toString('hex'));

      data.push(scriptCode.length, ...scriptCode);

      //  amount:
      data.push(...selectedInput.amountInBuffer);
      //  nSequence:
      data.push(...selectedInput.sequenceInBuffer);
      //  hashOutputs
      /*
      If the sighash type is neither SINGLE nor NONE, hashOutputs is the double SHA256 of the serialization of all output amount (8-byte little endian) with scriptPubKey (serialized as scripts inside CTxOuts);
      If sighash type is SINGLE and the input index??  is smaller than the number of outputs, hashOutputs is the double SHA256 of the output amount with scriptPubKey of the same index as the input;
      Otherwise, hashOutputs is a uint256 of 0x0000......0000.
      */
      if (outputs.length != 0) {
        console.log('outputs:', Buffer.from(outputs).toString('hex'));
        const hashOutputs = Cryptor.sha256round(outputs);
        console.log('hashOutputs:', hashOutputs.toString('hex'));
        data.push(...hashOutputs);
      } else {
        const buf = Buffer.alloc(32, 0);
        data.push(...buf);
      }

      //  nLockTime:
      data.push(...this._lockTime);
      //  nHashType:
      data.push(...selectedInput.hashTypeInBuffer);
    } else {
      //  nVersion
      data.push(...this._version);
      // Input count
      data.push(this._inputs.length);
      for (const input of this._inputs) {
        //  outpoint:
        data.push(...input.reservedTxId, ...input.voutInBuffer);
        if (input == selectedInput) {
          //  txin:
          let script = [];
          if (input.utxo.type == BitcoinTransactionType.PUBKEYHASH) {
            script = BitcoinUtils.toP2pkhScript(BitcoinUtils.toPubKeyHash(input.publicKey));
          } else if (input.utxo.type == BitcoinTransactionType.PUBKEY) {
            script = BitcoinUtils.toP2pkScript(input.publicKey);
          } else if (input.utxo.type == BitcoinTransactionType.SCRIPTHASH) {
            script = BitcoinUtils.pubkeyToBIP49RedeemScript(input.publicKey);
          } else if (input.utxo.type ==
              BitcoinTransactionType.WITNESS_V0_KEYHASH) {
            // do nothing
          } else {
            console.warn(`Unusable utxo: ${input.utxo.txId}`);
            return null;
          }
          data.push(...script);
        } else {
          data.push(0);
        }
        //  nSequence:
        data.push(...selectedInput.sequenceInBuffer);
      }
      // Output count
      data.push(this._outputs.length);
      console.log(`this._outputs.length: ${this._outputs.length}`);

      for (const output of this._outputs) {
        console.log(`output amountInBuffer: ${output.amountInBuffer.toString('hex')}`);
        console.log(`output script: ${output.script.toString('hex')}`);

        data.push(...output.amountInBuffer, ...output.script);
      }
      //  nLockTime:
      data.push(...this._lockTime);
    }
    console.log(`data: ${Buffer.from(data).toString('hex')}`);
    return Buffer.from(data);
  }

  // @override
  get serializeTransaction() {
    let data = [];
    //  nVersion
    data.push(...this._version);

    // Input count
    data.push(this._inputs.length);

    // Input
    let segwit = false;
    for (const input of this._inputs) {
      data.push(...input.reservedTxId, ...input.voutInBuffer);
      if (input.isSegwit(this._segwitType)) {
        segwit = true;
        if (input.utxo.type == BitcoinTransactionType.SCRIPTHASH)
          data.push(input.utxo.data.length, ...input.utxo.data);
        else
          data.push(0);
      } else {
        input.scriptSig != null ? data.push(...input.scriptSig) : data.push(0);
      }
      data.push(...input.sequenceInBuffer);
    }
    // Output count
    data.push(this._outputs.length);

    // Output
    for (const output of this._outputs) {
      data.push(...output.amountInBuffer, ...output.script);
    }
    // txId
    this.txId = Cryptor.sha256round(Buffer.from([...data, ...this._lockTime])).reverse().toString('hex');

    //witness
    if (segwit) {
      for (const input of this._inputs) {
        if (input.isSegwit(this._segwitType)) {
          if (input.scriptSig != null) {
            data.push(...input.scriptSig);
          }
        } else {
          data.push(0);
        }
      }
      data.splice(4, 0, [BitcoinTransaction.ADVANCED_TRANSACTION_MARKER, BitcoinTransaction.ADVANCED_TRANSACTION_FLAG]);
    }

    //  nLockTime:
    data.push(...this._lockTime);

    return Buffer.from(data);
  }

  get transactionHash() {
    return Cryptor.sha256round(this.serializeTransaction);
  }
}

module.exports = {
  BitcoinTransaction,
  BitcoinTransactionType,
  SegwitType,
  HashType,
};
