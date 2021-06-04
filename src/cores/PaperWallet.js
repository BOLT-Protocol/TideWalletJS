const keythereum = require("keythereum");
const bitcoin = require("bitcoinjs-lib");

const Cryptor = require('../helpers/Cryptor')

class PaperWallet {
  static EXT_PATH = "m/84'/3324'/0'";
  static EXT_CHAININDEX = 0;
  static EXT_KEYINDEX = 0;

  /**
   * keyObject{
   *   address: "008aeeda4d805471df9b2a5b0f38a0c3bcba786b",
   *   Crypto: {
   *     cipher: "aes-128-ctr",
   *     ciphertext: "5318b4d5bcd28de64ee5559e671353e16f075ecae9f99c7a79a38af5f869aa46",
   *     cipherparams: {
   *       iv: "6087dab2f9fdbbfaddc31a909735c1e6"
   *     },
   *     mac: "517ead924a9d0dc3124507e3393d175ce3ff7c1e96529c6c555ce9e51205e9b2",
   *     kdf: "pbkdf2",
   *     kdfparams: {
   *       c: 262144,
   *       dklen: 32,
   *       prf: "hmac-sha256",
   *       salt: "ae3cd4e7013836a3df6bd7241b12db061dbe2c6785853cce422d148a624ce0bd"
   *     }
   *   },
   *   id: "e13b209c-3b2f-4327-bab0-3bef2e51630d",
   *   version: 3
   * }
   */

  /**
   * @method createWallet
   * @param {string} privateKey
   * @param {string} password
   * @returns {object} keyObject
   */
  static createWallet(privateKey, password) {
    // Note: if options is unspecified, the values in keythereum.constants are used.
    const options = {
      kdf: "pbkdf2",
      cipher: "aes-128-ctr",
      kdfparams: {
        c: 262144,
        dklen: 32,
        prf: "hmac-sha256"
      }
    };

    let pk = privateKey;
    if (privateKey.startsWith('0x')) pk = privateKey.substr(2);
    const bufPk = Buffer.from(pk, 'hex');

    const salt = Cryptor.randomBytes(32);
    const iv = Cryptor.randomBytes(16);
    const keyObject = keythereum.dump(password, bufPk, salt, iv, options);
    return keyObject;
  }

  /**
   * @method recoverFromJson
   * @param {string} content
   * @param {string} password
   * @returns {object} keyObject
   */
  static recoverFromJson() {}

  /**
   * @method updatePassword
   * @param {object} oriKeyObject
   * @param {string} newPassword
   * @return {object} keyObject
   */
  static updatePassword() {}

  /**
   * @method magicSeed
   * @param {string} pk
   * @returns {string} pk used keccak256 twice
   */
  static magicSeed(pk) {
    return Cryptor.keccak256round(pk, 2)
  }

  /**
   * @method getPubKey
   * @param {Buffer} seed bip seed
   * @param {number} chainIndex - integer for hdwallet chainIndex
   * @param {number} keyIndex - integer for hdwallet keyIndex
   * @param {string} [path] - default EXT_PATH
   * @param {boolean} [compressed] - default true
   * @returns {string}
   */
  static getPubKey(seed, chainIndex, keyIndex, path, compressed) {}

  /**
   * @method getPriKey
   * @param {Buffer} seed bip seed
   * @param {number} chainIndex - integer for hdwallet chainIndex
   * @param {number} keyIndex - integer for hdwallet keyIndex
   * @param {string} [path] - default EXT_PATH
   * @param {boolean} [compressed] - default true
   * @returns {string}
   */
  static getPriKey(seed, chainIndex, keyIndex, path, compressed) {}

  /**
   * @method getExtendedPublicKey
   * @param {Buffer} seed 
   * @returns {string}
   */
  static getExtendedPublicKey(seed) {
    let root = bitcoin.bip32.fromSeed(seed);
    root = root.derivePath(PaperWallet.EXT_PATH);

    const xPub = root.neutered().toBase58();

    return xPub;
  }

  /**
   * @method walletToJson
   * @param {object} wallet - keyObject
   * @returns {string} wallet to string
   */
  static walletToJson(wallet) {
    return JSON.stringify(wallet);
  }

  /**
   * @method jsonToWallet
   * @param {string} walletStr - keyObject string
   * @returns {object} keyObject
   */
  static jsonToWallet(walletStr) {
    return JSON.parse(walletStr);
  }
}

module.exports = PaperWallet;
