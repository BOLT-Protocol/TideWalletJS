const keyStore = require('key-store');
const bitcoin = require("bitcoinjs-lib");

const Cryptor = require('../helpers/Cryptor');
const rlp = require("./../helpers/rlp");

class PaperWallet {
  static EXT_PATH = "m/84'/3324'/0'";
  static EXT_CHAININDEX = 0;
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
   * @param {number} chainIndex - integer for hdwallet chainIndex
   * @param {number} keyIndex - integer for hdwallet keyIndex
   * @param {object} options
   * @param {string} [path] - default EXT_PATH
   * @param {boolean} [compressed] - default true
   * @returns {string}
   */
  static getPubKey(seed, chainIndex, keyIndex, options = {}) {
    const {path = PaperWallet.EXT_PATH, compressed = true } = options;
    const dPath = `${path}/${chainIndex}/${keyIndex}`;
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
   * @param {number} chainIndex - integer for hdwallet chainIndex
   * @param {number} keyIndex - integer for hdwallet keyIndex
   * @param {object} options
   * @param {string} [options.path] - default EXT_PATH
   * @returns {string}
   */
  static getPriKey(seed, chainIndex, keyIndex, options = {}) {
    const {path = PaperWallet.EXT_PATH } = options;
    const dPath = `${path}/${chainIndex}/${keyIndex}`;
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

  static instance;
  /**
   * 
   * @param {User} user 
   * @returns 
   */
  constructor(user) {
    if (!PaperWallet.instance) {
      this._user = user;
      this._keystoreObject = null;
      PaperWallet.instance = this;
    }

    return PaperWallet.instance;
  }

  /**
   * get nonce
   * @param {String} userIdentifier
   * @returns {String}
   */
   _getNonce(userIdentifier) {
    const cafeca = 0xcafeca;
    let nonce = cafeca;

    const getString = (nonce) =>
      Cryptor.keccak256round(
        Buffer.concat([
          Buffer.from(userIdentifier, "utf8"),
          rlp.toBuffer(nonce),
        ]).toString("hex"),
        1
      )
        .slice(0, 3)
        .toLowerCase();

    while (getString(nonce) != "cfc") {
      nonce = Number(nonce) + 1;
    }

    return nonce;
  }

  /**
   * get password
   * @param {Object} userInfo
   * @param {String} userInfo.userIdentifier
   * @param {String} userInfo.userId
   * @param {String} userInfo.installId
   * @param {Number} userInfo.timestamp
   * @returns {String} password
   */
   getPassword({ userIdentifier, userId, installId, timestamp }) {
    const userIdentifierBuff = Buffer.from(userIdentifier, "utf8").toString(
      "hex"
    );
    const installIdBuff = Buffer.from(installId).toString("hex");
    const pwseed = Cryptor.keccak256round(
      Buffer.concat([
        Buffer.from(
          Cryptor.keccak256round(
            Buffer.concat([
              Buffer.from(
                Cryptor.keccak256round(
                  userIdentifierBuff || this.thirdPartyId,
                  1
                )
              ),
              Buffer.from(Cryptor.keccak256round(userId || this.id, 1)),
            ]).toString()
          )
        ),
        Buffer.from(
          Cryptor.keccak256round(
            Buffer.concat([
              Buffer.from(
                Cryptor.keccak256round(
                  rlp
                    .toBuffer(
                      rlp.toBuffer(timestamp).toString("hex").slice(3, 6)
                    )
                    .toString("hex"),
                  1
                )
              ),
              Buffer.from(
                Cryptor.keccak256round(installIdBuff || this.installId, 1)
              ),
            ]).toString()
          )
        ),
      ]).toString()
    );
    const password = Cryptor.keccak256round(pwseed);
    return password;
  }

  _generateUserSeed({
    userIdentifier,
    userId,
    userSecret,
  }) {
    const nonce = this._getNonce(userIdentifier);

    const userIdentifierBuff = Buffer.from(userIdentifier, "utf8").toString(
      "hex"
    );
    const _main = Buffer.concat([
      Buffer.from(userIdentifierBuff, "utf8"),
      rlp.toBuffer(nonce),
    ])
      .toString()
      .slice(0, 16);

    const _extend = Cryptor.keccak256round(
      rlp.toBuffer(nonce).toString("hex"),
      1
    ).slice(0, 8);

    const seed = Cryptor.keccak256round(
      Buffer.concat([
        Buffer.from(
          Cryptor.keccak256round(
            Buffer.concat([
              Buffer.from(Cryptor.keccak256round(_main, 1)),
              Buffer.from(Cryptor.keccak256round(_extend, 1)),
            ]).toString()
          )
        ),
        Buffer.from(
          Cryptor.keccak256round(
            Buffer.concat([
              Buffer.from(Cryptor.keccak256round(userId, 1)),
              Buffer.from(Cryptor.keccak256round(userSecret, 1)),
            ]).toString()
          )
        ),
      ]).toString()
    );
    return {seed, _extend};
  }

  /**
   * generate Credential Data
   * @param {Object} userInfo
   * @param {String} userInfo.userIdentifier
   * @param {String} userInfo.userId
   * @param {String} userInfo.userSecret
   * @param {String} userInfo.installId
   * @param {Number} userInfo.timestamp
   * @returns {Object} result
   * @returns {String} result.key
   * @returns {String} result.password
   * @returns {String} result.extend
   */
   _generateCredentialData({
    userIdentifier,
    userId,
    userSecret,
    installId,
    timestamp,
  }) {
    const {seed, _extend} = this._generateUserSeed({ userIdentifier, userId, userSecret });

    const key = Cryptor.keccak256round(seed);
    const password = this.getPassword({
      userIdentifier,
      userId,
      installId,
      timestamp,
    });

    return { key, password, extend: _extend };
  }

  /**
   * createWallet
   * @param {Object} userInfo
   * @param {String} userInfo.userIdentifier
   * @param {String} userInfo.userId
   * @param {String} userInfo.userSecret
   * @param {String} userInfo.installId
   * @param {Number} userInfo.timestamp
   * @returns {Object} result
   * @returns {object} result.wallet - keyObject
   * @returns {String} result.extendPublicKey
   */
  async createWallet({
    userIdentifier,
    userId,
    userSecret,
    installId,
    timestamp,
  }) {
    const credentialData = this._generateCredentialData({
      userIdentifier,
      userId,
      userSecret,
      installId,
      timestamp,
    });
    const wallet = await PaperWallet.createWallet(
      credentialData.key,
      credentialData.password
    );
    const privateKey = PaperWallet.recoverFromJson(
      PaperWallet.walletToJson(wallet),
      credentialData.password
    );
    const seed = await PaperWallet.magicSeed(privateKey);
    const _seed = Buffer.from(seed);
    const extendPublicKey = PaperWallet.getExtendedPublicKey(_seed);
    return { wallet, extendPublicKey }
  }

  /**
   * createWalletWithSeed
   * @param {Object} userInfo
   * @param {String} userInfo.seed
   * @param {String} userInfo.userIdentifier
   * @param {String} userInfo.userId
   * @param {String} userInfo.installId
   * @param {Number} userInfo.timestamp
   * @returns {Object} result
   * @returns {object} result.wallet - keyObject
   * @returns {String} result.extendPublicKey
   */
  async createWalletWithSeed({
    seed,
    userIdentifier,
    userId,
    installId,
    timestamp,
  }) {
    const password = this.getPassword({
      userIdentifier,
      userId,
      installId,
      timestamp,
    });
    const wallet = await PaperWallet.createWallet(
      seed,
      password
    );
    const _seed = Buffer.from(seed);
    const extendPublicKey = PaperWallet.getExtendedPublicKey(_seed);
    return { wallet, extendPublicKey }
  }

  /**
   * _getSeed
   * @returns {string} seed
   */
  async _getSeedByKeyStore() {
    const keyStore = await this._user.getKeystore();
    const pk = PaperWallet.recoverFromJson(keyStore, password);
    const seed = PaperWallet.magicSeed(pk);
    return seed;
  }
  
  /**
   * getExtendedPublicKey
   * @returns {string} extPK
   */
  async getExtendedPublicKey() {
    const seed = await this._getSeedByKeyStore();
    const extPK = PaperWallet.getExtendedPublicKey(seed);
    return extPK;
  }

  /**
   * getPriKey
   * @param {string} password 
   * @param {number} chainIndex 
   * @param {number} keyIndex 
   * @param {object} [options]
   * @param {string} [options.path] - default EXT_PATH
   * @returns 
   */
  async getPriKey(password, chainIndex, keyIndex, options = {}) {
    const keyStore = await this._user.getKeystore();
    const pk = PaperWallet.recoverFromJson(keyStore, password);
    const seed = PaperWallet.magicSeed(pk);
    const privateKey = PaperWallet.getPriKey(Buffer.from(seed, 'hex'), chainIndex, keyIndex, options);
    return privateKey;
  }
}

module.exports = PaperWallet;
