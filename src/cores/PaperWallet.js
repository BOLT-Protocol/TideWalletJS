const keyStore = require('key-store');
const bitcoin = require("bitcoinjs-lib");

const Cryptor = require('../helpers/Cryptor');

class PaperWallet {
  static EXT_PATH = "m/84'/3324'/0'";
  static EXT_CHANGEINDEX = 0;
  static EXT_KEYINDEX = 0;
  static KEYSTOREID = 'keyObject'

  /**
   * keyObject: {
   *  metadata:
   *    { nonce: 'rFTRLcQhKxN4XoAql3u0NXxZ7P0Xy1h7', iterations: 10000 },
   *  public: {},
   *  private: 
   *    'wz+zDOrp7ZOUZVuG/7AfJM9GhgHXlsiXwg478GmTm9r3uFGOcFRzY2ldVN1cmSURI6YKJS2EjIMBSVh5caZcBg26sLA124+k2PPV+VrYFoYidTMvZG1XzdUQvkybP/cwQN9OedCO8fOyIwoYeqA1RGMVhjHyoqM7bdGdjknmDibrKj5pG+uu1CU+fbPVQ/TUMig='
   * }
   */

  /**
   * @method createWallet
   * @param {string} privateKey
   * @param {string} password
   * @returns {object} keyObject
   */
  static async createWallet(privateKey, password) {
    try {
      let storage = {}
      const keystore = keyStore.createStore((data) => {storage = data});
      await keystore.saveKey(PaperWallet.KEYSTOREID, password, privateKey);

      return storage;
    } catch (error) {
      console.log(error)
    }
  }

  /**
   * @method recoverFromJson
   * @param {string} keyObjectJson
   * @param {string} password
   * @returns {string} privateKey
   */
  static recoverFromJson(keyObjectJson, password) {
    try {
      const keyObject = PaperWallet.jsonToWallet(keyObjectJson);
      let storage = {}
      const keystore = keyStore.createStore((data) => {storage = data}, keyObject);

      const pk = keystore.getPrivateKeyData(PaperWallet.KEYSTOREID, password);
      return pk;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  /**
   * @method updatePassword
   * @param {object} oriKeyObject
   * @param {string} oriPassword
   * @param {string} newPassword
   * @return {object} keyObject
   */
  static updatePassword(oriKeyObject, oriPassword, newPassword) {
    const pk = PaperWallet.recoverFromJson(PaperWallet.walletToJson(oriKeyObject), oriPassword);
    return PaperWallet.createWallet(pk.toString('hex'), newPassword);
  }

  /**
   * @method magicSeed
   * @param {string} pk
   * @returns {string} pk used keccak256 twice
   */
  static magicSeed(pk) {
    if (pk.length < 128) {
      return Cryptor.keccak256round(pk, 2)
    }
    return pk;
  }

  /**
   * @method getPubKey
   * @param {Buffer} seed bip seed
   * @param {number} changeIndex - integer for hdwallet changeIndex
   * @param {number} keyIndex - integer for hdwallet keyIndex
   * @param {object} options
   * @param {string} [path] - default EXT_PATH
   * @param {boolean} [compressed] - default true
   * @returns {string}
   */
  static getPubKey(seed, changeIndex, keyIndex, options = {}) {
    const {path = PaperWallet.EXT_PATH, compressed = true } = options;
    const dPath = `${path}/${changeIndex}/${keyIndex}`;
    const root = bitcoin.bip32.fromSeed(seed);
    const child = root.derivePath(dPath);
    if (!compressed) {
      return bitcoin.ECPair.fromPublicKey(child.publicKey, { compressed: false }).publicKey.toString('hex');
    }
    return child.publicKey.toString('hex');
  }

  /**
   * @method getPriKey
   * @param {Buffer} seed bip seed
   * @param {number} changeIndex - integer for hdwallet changeIndex
   * @param {number} keyIndex - integer for hdwallet keyIndex
   * @param {object} options
   * @param {string} [options.path] - default EXT_PATH
   * @returns {string}
   */
  static getPriKey(seed, changeIndex, keyIndex, options = {}) {
    const {path = PaperWallet.EXT_PATH } = options;
    const dPath = `${path}/${changeIndex}/${keyIndex}`;
    const root = bitcoin.bip32.fromSeed(seed);
    const child = root.derivePath(dPath);
    return child.privateKey.toString('hex');
  }

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
