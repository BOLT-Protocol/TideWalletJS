const SafeMath = require('./SafeMath');
const bs58check = require('bs58check');
const bchaddr = require('bchaddrjs');
const bitcoin = require('bitcoinjs-lib');


const Cryptor = require('./Cryptor');
const { Bech32Codec } = require('./besh32');
const { SegwitCodec, convertBits } = require('./segwit');

const OP_0 = 0x00;
const OP_PUSHDATA1 = 0x4c;
const OP_PUSHDATA2 = 0x4d;
const OP_PUSHDATA4 = 0x4e;
const OP_1NEGATE = 0x4f;
const OP_1 = 0x51;
const OP_16 = 0x60;
const OP_DUP = 0x76;
const OP_EQUAL = 0x87;
const OP_EQUALVERIFY = 0x88;
const OP_HASH160 = 0xa9;
const OP_CHECKSIG = 0xac;
const OP_CODESEPARATOR = 0xab;

const LITECOIN_MAIN = {
  messagePrefix: '\x19Litecoin Mainnet Signed Message:\n',
  bech32: 'ltc',
  bip32: {
    public: 0x019da462,
    private: 0x019d9cfe,
  },
  pubKeyHash: 0x30,
  scriptHash: 0x32,
  wif: 0xb0,
};

const LITECOIN_TEST = {
  messagePrefix: '\x19Litecoin Testnet Signed Message:\n',
  bech32: 'tltc',
  bip32: {
    public: 0x0436EF7D,
    private: 0x0436F6E1,
  },
  pubKeyHash: 0x6F,
  scriptHash: 0xEF,
  wif: 0xC4,
};

class bitcoinUtils{
  /**
   * @param {Buffer} uncompressedPubKey
   * @returns {Buffer}
   */
  static compressedPubKey(uncompressedPubKey) {
    let ucpk = uncompressedPubKey;
    if (uncompressedPubKey.length % 2 === 1) {
      ucpk = ucpk.slice(1, ucpk.length);
    }
  
    const x = ucpk.slice(0, 32);
    const y = ucpk.slice(32, 64);

    const strX = x.toString('hex');
    const strY = y.toString('hex');

    const check = SafeMath.compressedPubKeyCheck(strX, strY);
  
    if (!check) return 'Error';
    const prefix = SafeMath.eq(SafeMath.mod(strY, 2), 0) ? '02' : '03';
    const compressed = Buffer.concat([Buffer.from(prefix, 'hex'), x]);
  
    return compressed;
  }
  
  /**
   * @param {Buffer} pubKey 
   * @returns {Buffer}
   */
  static toPubKeyHash(pubKey) {
    const publicKey = pubKey.length > 33 ? bitcoinUtils.compressedPubKey(pubKey) : pubKey;
    const pubKeyHash = Cryptor.hash160(publicKey);
    return pubKeyHash;
  }
  
  /**
   * @param {Buffer} pubKeyHash 
   * @returns {Buffer}
   */
  static toP2pkhScript(pubKeyHash) {
    // Pubkey Hash to P2PKH Script
    const data = [];
    data.push(OP_DUP); //0x76;
    data.push(OP_HASH160); // 0xa9;
    data.push(pubKeyHash.length);
    data.push(...pubKeyHash);
    data.push(OP_EQUALVERIFY); //0x88;
    data.push(OP_CHECKSIG); // 0xac；
    return Buffer.from(data);
  }
  
  /**
   * @param {Buffer} sriptHash
   * @returns {Buffer}
   */
  static toP2shScript(sriptHash) {
    // Pubkey Hash to P2PKH Script
    const data = [];
    data.push(OP_HASH160);
    data.push(sriptHash.length);
    data.psuh(...sriptHash);
    data.push(OP_EQUAL);
    return Buffer.from(data);
  }
  
  /**
   * @param {Buffer} pubKey 
   * @returns {Buffer}
   */
  static toP2pkScript(pubKey) {
    const publicKey = pubKey.length > 33 ? bitcoinUtils.compressedPubKey(pubKey) : pubKey;
    let data = [];
    data.push(publicKey.length);
    data.psuh(...publicKey);
    data.push(OP_CHECKSIG);
    return Buffer.from(data);
  }
  
  /**
   * @param {Buffer} pubKey 
   * @returns {Buffer}
   */
  static pubkeyToBIP49RedeemScript(pubKey) {
    const pubKeyHash = bitcoinUtils.toPubKeyHash(pubKey);
    let rs = [OP_0, pubKeyHash.length];
    rs.push(...pubKeyHash);
    return Buffer.from(rs);
  }
  
  /**
   * Bip44
   * @param {Buffer} pubKey 
   * @param {Number} p2pkhAddressPrefix 
   * @returns {string}
   */
  static pubKeyToP2pkhAddress(pubKey, p2pkhAddressPrefix) {
    const fingerprint = bitcoinUtils.toPubKeyHash(pubKey);
    const hashPubKey =
        Buffer.from([p2pkhAddressPrefix, ...fingerprint]);
    const address = bs58check.encode(hashPubKey);
    return address;
  }
  
  /**
   * @param {Buffer} pubKey 
   * @param {Number} p2pkhAddressPrefix 
   * @returns {string}
   */
  static pubKeyToP2pkhCashAddress(pubKey, p2pkhAddressPrefix) {
    // Compressed Public Key to P2PKH Cash Address
    const lagacyAddress = bitcoinUtils.pubKeyToP2pkhAddress(pubKey, p2pkhAddressPrefix);
    const address = bchaddr.toCashAddress(lagacyAddress);
    return address;
  }
  
  /**
   * Bip84
   * @param {Buffer} pubKey 
   * @param {string} bech32Hrp 
   * @returns {string}
   */
  static pubKeyToP2wpkhAddress(pubKey, bech32Hrp) {
    let address;
    if (bech32Hrp == 'bc') {
      const p2wpkh = bitcoin.payments.p2wpkh({ pubKey, network: bitcoin.networks.bitcoin });
      address = p2wpkh.address
    } else if (bech32Hrp == 'tb') {
      const p2wpkh = bitcoin.payments.p2wpkh({ pubKey, network: bitcoin.networks.testnet });
      address = p2wpkh.address
    } else if (bech32Hrp == 'ltc') {
      const p2wpkh = bitcoin.payments.p2wpkh({ pubkey, network: LITECOIN_MAIN });
      address = p2wpkh.address
    } else if (bech32Hrp == 'tltc') {
      const p2wpkh = bitcoin.payments.p2wpkh({ pubkey, network: LITECOIN_TEST });
      address = p2wpkh.address
    }
    return address;
  }
  
  /**
   * Bip49
   * @param {Buffer} pubKey 
   * @param {Number} p2shAddressPrefix 
   * @returns 
   */
  static pubKeyToP2wpkhNestedInP2shAddress(pubKey, p2shAddressPrefix) {
    const redeemScript = bitcoinUtils.pubkeyToBIP49RedeemScript(pubKey);
    const fingerprint = Cryptor.hash160(redeemScript);
    // List<int> checksum = sha256(sha256(fingerprint)).sublist(0, 4);
    // bs58check library 會幫加checksum
    const address =
        bs58check.encode(Buffer.from([p2shAddressPrefix, ...fingerprint]));
  
    return address;
  }
  
  /**
   * @param {string} address 
   * @returns {Buffer}
   */
  static decodeAddress(address) {
    if (address.includes(':')) {
      address = address.split(':')[1];
    }
    let decodedData;
    try {
      decodedData = bs58check.decode(address);
    } catch (e) {
      return Buffer.alloc(1, 0);
    }
    return decodedData;
  }
  
  /**
   * Extract Script Pubkey from SegWit Address
   * @param {String} address 
   * @returns {Buffer}
   */
  static extractScriptPubkeyFromSegwitAddress(address) {
    const _address = SegwitCodec.decode(address);
    const scriptPubKey = _address.scriptPubKey;
    // Log.debug('scriptPubKey: $scriptPubKey');
    return Buffer.from(scriptPubKey, 'hex');
  }
  
  /**
   * @param {string} address 
   * @param {Number} p2pkhAddressPrefix 
   * @returns {boolean}
   */
  static isP2pkhAddress(address, p2pkhAddressPrefix) {
    // Log.debug('p2pkhAddressPrefix: $p2pkhAddressPrefix');
    let decodedData = bitcoinUtils.decodeAddress(address);
    if (decodedData.length != 21) return false;
    const isP2pkhAddress = decodedData.readUInt8(0) == p2pkhAddressPrefix;
  
    return isP2pkhAddress;
  }
  
  /**
   * @param {string} address 
   * @param {Number} p2shAddressPrefix 
   * @returns {boolean}
   */
  static isP2shAddress(address, p2shAddressPrefix) {
    const decodedData = bitcoinUtils.decodeAddress(address);
    if (decodedData.length != 21) return false;
    const isP2pkhAddress = decodedData.readUInt8(0) == p2shAddressPrefix;
  
    return isP2pkhAddress;
  }
  
  /**
   * @param {string} address 
   * @param {string} bech32HRP 
   * @param {string} bech32Separator 
   * @returns {boolean}
   */
  static isSegWitAddress(address, bech32HRP, bech32Separator) {
    if (address.includes(':')) {
      address = address.split(':')[1];
    }
    let hrp = "";
    if (address.startsWith(`${bech32HRP}${bech32Separator}`)) {
      hrp = bech32HRP;
    } else
      return false;
    try {
      const bech32 = Bech32Codec.decode(
        address,
        address.length,
      );
      if (bech32.hrp != hrp) return false;
      const version = bech32.data[0];
      const program = convertBits(bech32.data.slice(1), 5, 8, false);
      if (version == 0 && program.length == 20) {
        // P2WPKH
        return true;
      }
      if (version == 0 && program.length == 32) {
        // P2WSH
        return true;
      }
    } catch (e) {
      console.trace(e);
      return false;
    }
    return false;
  }
}

module.exports = bitcoinUtils;
