import 'dart:typed_data';
import 'package:convert/convert.dart';
import 'package:decimal/decimal.dart';

import 'utxo.model.dart';
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
  final UnspentTxOut utxo;
  scriptSig;
  int sequence;

  constructor(utxo, hashType) {
    this.utxo = utxo,
    this.publicKey = utxo.publickey,
    this.address = utxo.address;
    this.hashType = hashType;

    this.segwit = false;
  }

  get reservedTxId() {
    return Buffer.from(this.utxo.txId, 'hex');
  }

  get voutInBuffer() {
    const buf = Buffer.allocUnsafe(4);
    buf.writeInt32LE(this.utxo.vout, 0);
    return buf;
  }

  get sequenceInBuffer() {
    const buf = Buffer.allocUnsafe(4);
    const sequence = this.utxo.sequence ? this.utxo.sequence : BitcoinTransaction.DEFAULT_SEQUENCE
    buf.writeInt32LE(sequence, 0);
    return buf;
  }

  get amountInBuffer() {
    const amount = this.utxo.amountInSmallestUint.toString(16).padStart(8, '0');
    return Buffer.from(amount, 'hex').reverse();
  }

  get hashTypeInBuffer() {
    const buf = Buffer.allocUnsafe(4);
    buf.writeInt32LE(this.hashType.value, 0);
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
  /* value in bitcoins of the output (inSatoshi)*/
  final Decimal amount; // inSatoshi
  /* the address or public key of the recipient */
  final String address;
  final Uint8List script;

  Output(this.amount, this.address, this.script);

  Uint8List get amountInBuffer => Uint8List(8)
    ..buffer.asByteData().setUint64(0, this.amount.toInt(), Endian.little);
}

class BitcoinTransaction extends Transaction {
  static const int ADVANCED_TRANSACTION_MARKER = 0x00;
  static const int ADVANCED_TRANSACTION_FLAG = 0x01;
  static const int DEFAULT_SEQUENCE = 0xffffffff;

  String id;
  String currencyId;
  String txId;
  int locktime;
  int timestamp;
  int confirmations;
  TransactionDirection direction;
  TransactionStatus status;
  String sourceAddresses = '';
  String destinationAddresses = '';
  Decimal amount;
  Decimal fee;
  Uint8List note;

  List<Input> _inputs;
  List<Output> _outputs;
  Uint8List _version;
  Uint8List _lockTime;
  SegwitType _segwitType;
  UnspentTxOut _changeUtxo;
  // bool _publish; //TODO get publish property from currency

  List<Input> get inputs => this._inputs;
  List<Output> get outputs => this._outputs;
  UnspentTxOut get changeUtxo => this._changeUtxo;

  BitcoinTransaction(
      {this.id,
      this.currencyId,
      this.txId,
      this.locktime,
      this.timestamp,
      this.confirmations,
      this.direction,
      this.status,
      this.sourceAddresses,
      this.destinationAddresses,
      this.amount,
      this.fee,
      this.note});

  BitcoinTransaction.prepareTransaction(bool publish, SegwitType segwitType,
      this.amount, this.fee, Uint8List note,
      {int lockTime}) // in Satoshi
      : _segwitType = segwitType,
        this.note = note ?? Uint8List(0) {
    _inputs = [];
    _outputs = [];
    _segwitType = segwitType ?? SegwitType.nativeSegWit;
    setVersion(publish ? 1 : 2);
    setlockTime(lockTime ?? 0);
  }

  void setVersion(int version) {
    _version = Uint8List(4)
      ..buffer.asByteData().setUint32(0, version, Endian.little);
    Log.verbose('_version: $_version');
  }

  void setlockTime(int locktime) {
    _lockTime = Uint8List(4)
      ..buffer.asByteData().setUint32(0, locktime, Endian.little);
    Log.verbose('_lockTime: $_lockTime');
  }

  void addChangeUtxo(UnspentTxOut changeUtxo) {
    this._changeUtxo = changeUtxo;
    Log.verbose('addChangeUtxo: $changeUtxo');
  }

  void addInput(UnspentTxOut utxo, HashType hashType) {
    Input input = Input(utxo, hashType);
    _inputs.add(input);
    try {
      this.sourceAddresses = this.sourceAddresses.isEmpty
          ? this.sourceAddresses += utxo.address
          : this.sourceAddresses += '${", " + utxo.address}';
    } catch (e) {
      Log.warning(e);
    }
  }

  void addOutput(
    Decimal amount, // in smallest uint
    String address,
    List<int> script,
  ) {
    if (script == null || script.length == 0) return null;
    List<int> scriptLength;
    if (script.length < 0xFD) {
      scriptLength = [script.length];
    } else if (script.length <= 0xFFFF) {
      List<int> scriptLengthData = (Uint8List(2)
            ..buffer.asByteData().setUint32(0, script.length, Endian.little))
          .toList();
      scriptLength = [0xFD] + scriptLengthData;
    } else {
      Log.warning(' unsupported script length');
      return null;
    }
    Output output =
        Output(amount, address, Uint8List.fromList(scriptLength + script));
    _outputs.add(output);
    this.destinationAddresses = this.destinationAddresses.isEmpty
        ? this.destinationAddresses += address
        : this.destinationAddresses += '${", " + address}';
  }

  void addData(List<int> data) {
    int scriptLength = data.length + 2;
    Output output = Output(Decimal.zero, '',
        Uint8List.fromList([scriptLength, 0x6a, data.length, ...data]));
    _outputs.add(output);
  }

  Uint8List getRawDataToSign(int index) {
    List<int> data = [];
    Input selectedInput = this._inputs[index];
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

      List<int> prevouts = [];
      List<int> sequences = [];
      List<int> outputs = [];
      for (Input input in this._inputs) {
        prevouts.addAll(input.reservedTxId + input.voutInBuffer);
        sequences.addAll(input.sequenceInBuffer);
      }

      if (selectedInput.hashType != HashType.SIGHASH_SINGLE ||
          selectedInput.hashType != HashType.SIGHASH_NONE)
        for (Output output in this._outputs) {
          outputs.addAll(output.amountInBuffer + output.script);
        }
      else if (selectedInput.hashType == HashType.SIGHASH_SINGLE &&
          index < this._outputs.length)
        outputs.addAll(
            this._outputs[index].amountInBuffer + this._outputs[index].script);

      List<int> hashPrevouts = Cryptor.sha256round(prevouts);
      List<int> hashSequence = Cryptor.sha256round(sequences);

      Log.verbose('hashPrevouts: ${hex.encode(hashPrevouts)}');
      Log.verbose('hashSequence: ${hex.encode(hashSequence)}');

      //  nVersion
      data.addAll(this._version);
      //  hashPrevouts
      /* 
      If the ANYONECANPAY flag is not set, hashPrevouts is the double SHA256 of the serialization of all input outpoints;
      Otherwise, hashPrevouts is a uint256 of 0x0000......0000.
      */
      if (selectedInput.hashType != HashType.SIGHASH_ANYONECANPAY)
        data.addAll(hashPrevouts);
      else
        data.addAll(
            Uint8List(32)..buffer.asByteData().setUint32(0, 0, Endian.little));

      //  hashSequence
      /* 
      If none of the ANYONECANPAY, SINGLE, NONE sighash type is set, hashSequence is the double SHA256 of the serialization of nSequence of all inputs;
      Otherwise, hashSequence is a uint256 of 0x0000......0000.
       */
      if (selectedInput.hashType == HashType.SIGHASH_ALL)
        data.addAll(hashSequence);
      else
        data.addAll(
            Uint8List(32)..buffer.asByteData().setUint32(0, 0, Endian.little));
      //  outpoint:
      data.addAll(selectedInput.reservedTxId + selectedInput.voutInBuffer);
      /*
      For P2WPKH witness program, the scriptCode is 0x1976a914{20-byte-pubkey-hash}88ac.
      For P2WSH witness program,
          if the witnessScript does not contain any OP_CODESEPARATOR, the scriptCode is the witnessScript serialized as scripts inside CTxOut.
          if the witnessScript contains any OP_CODESEPARATOR, the scriptCode is the witnessScript but removing everything up to and including 
          the last executed OP_CODESEPARATOR before the signature checking opcode being executed, serialized as scripts inside CTxOut. 
          (The exact semantics is demonstrated in the examples below)
       */
      //  scriptCode:
      List<int> scriptCode =
          toP2pkhScript(toPubKeyHash(selectedInput.publicKey));
      Log.verbose(
          'prevOutScript: ${hex.encode([scriptCode.length, ...scriptCode])}');
      data.addAll([scriptCode.length, ...scriptCode]);

      //  amount:
      data.addAll(selectedInput.amountInBuffer);
      //  nSequence:
      data.addAll(selectedInput.sequenceInBuffer);
      //  hashOutputs
      /*
      If the sighash type is neither SINGLE nor NONE, hashOutputs is the double SHA256 of the serialization of all output amount (8-byte little endian) with scriptPubKey (serialized as scripts inside CTxOuts);
      If sighash type is SINGLE and the input index??  is smaller than the number of outputs, hashOutputs is the double SHA256 of the output amount with scriptPubKey of the same index as the input;
      Otherwise, hashOutputs is a uint256 of 0x0000......0000.
      */
      if (outputs.isNotEmpty) {
        Log.debug('outputs: ${hex.encode(outputs)}');
        List<int> hashOutputs = Cryptor.sha256round(outputs);
        data.addAll(hashOutputs);
        Log.verbose('hashOutputs: ${hex.encode(hashOutputs)}');
      } else
        data.addAll(
            Uint8List(32)..buffer.asByteData().setUint32(0, 0, Endian.little));

      //  nLockTime:
      data.addAll(this._lockTime);
      //  nHashType:
      data.addAll(selectedInput.hashTypeInBuffer);
    } else {
      //  nVersion
      data.addAll(this._version);
      // Input count
      data.add(this._inputs.length);
      for (Input input in this._inputs) {
        //  outpoint:
        data.addAll(input.reservedTxId + input.voutInBuffer);
        if (input == selectedInput) {
          //  txin:
          List<int> script;
          if (input.utxo.type == BitcoinTransactionType.PUBKEYHASH) {
            script = toP2pkhScript(toPubKeyHash(input.publicKey));
          } else if (input.utxo.type == BitcoinTransactionType.PUBKEY) {
            script = toP2pkScript(input.publicKey);
          } else if (input.utxo.type == BitcoinTransactionType.SCRIPTHASH) {
            script = pubkeyToBIP49RedeemScript(input.publicKey);
          } else if (input.utxo.type ==
              BitcoinTransactionType.WITNESS_V0_KEYHASH) {
            // do nothing
          } else {
            Log.warning('Unusable utxo: ${input.utxo.txId}');
            return null;
          }
          data.addAll(script);
        } else {
          data.add(0);
        }
        //  nSequence:
        data.addAll(selectedInput.sequenceInBuffer);
      }
      // Output count
      data.add(this._outputs.length);
      Log.debug('this._outputs.length: ${this._outputs.length}');

      for (Output output in this._outputs) {
        Log.debug(
            'output amountInBuffer: ${hex.encode(output.amountInBuffer)}');
        Log.debug('output script: ${hex.encode(output.script)}');

        data.addAll(output.amountInBuffer + output.script);
      }
      //  nLockTime:
      data.addAll(this._lockTime);
    }
    Log.debug('data: ${hex.encode(data)}');
    return Uint8List.fromList(data);
  }

  @override
  Uint8List get serializeTransaction {
    List<int> data = [];
    //  nVersion
    data.addAll(this._version);

    // Input count
    data.add(this._inputs.length);

    // Input
    bool segwit = false;
    for (Input input in this._inputs) {
      data.addAll(input.reservedTxId + input.voutInBuffer);
      if (input.isSegwit(this._segwitType)) {
        segwit = true;
        if (input.utxo.type == BitcoinTransactionType.SCRIPTHASH)
          data.addAll([input.utxo.data.length, ...input.utxo.data]);
        else
          data.add(0);
      } else {
        input.scriptSig != null ? data.addAll(input.scriptSig) : data.add(0);
      }
      data.addAll(input.sequenceInBuffer);
    }
    // Output count
    data.add(this._outputs.length);

    // Output
    for (Output output in this._outputs) {
      data.addAll(output.amountInBuffer + output.script);
    }
    // txId
    this.txId = hex.encode(
        Cryptor.sha256round([...data, ...this._lockTime]).reversed.toList());

    //witness
    if (segwit) {
      for (Input input in this._inputs) {
        if (input.isSegwit(this._segwitType)) {
          if (input.scriptSig != null) {
            data.addAll(input.scriptSig);
          }
        } else {
          data.add(0);
        }
      }
      data.insertAll(
          4, [ADVANCED_TRANSACTION_MARKER, ADVANCED_TRANSACTION_FLAG]);
    }

    //  nLockTime:
    data.addAll(this._lockTime);

    return Uint8List.fromList(data);
  }

  Uint8List get transactionHash {
    return Cryptor.sha256round(serializeTransaction);
  }
}
