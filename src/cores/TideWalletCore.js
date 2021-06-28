const PaperWallet = require('./PaperWallet');
const Signer = require('./Signer');
const Cryptor = require('../helpers/Cryptor');
const rlp = require("./../helpers/rlp");

class TideWalletCore {
  static instance;

  constructor() {
    if (!TideWalletCore.instance) {
      this._userInfo = {};
      TideWalletCore.instance = this;
    }

    return TideWalletCore.instance;
  }

  /**
   * initial
   * @param {Object} userInfo
   * @param {String} userInfo.id
   * @param {String} userInfo.thirdPartyId
   * @param {String} userInfo.installId
   * @param {Number} userInfo.timestamp
   * @param {string} userInfo.keystore
   * @returns 
   */
   setUserInfo(userInfo) {
    this._userInfo = userInfo;
    console.log(userInfo)
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
   _getPassword({ userIdentifier, userId, installId, timestamp }) {
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
                  userIdentifierBuff || this._userInfo.thirdPartyId,
                  1
                )
              ),
              Buffer.from(Cryptor.keccak256round(userId || this._userInfo.id, 1)),
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
                Cryptor.keccak256round(installIdBuff || this._userInfo.installId, 1)
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
    const password = this._getPassword({
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
    const password = this._getPassword({
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
   * _getSeedByKeyStore
   * @returns {string} seed
   */
  async _getSeedByKeyStore() {
    const password = this._getPassword({
      userIdentifier: this._userInfo.thirdPartyId,
      userId: this._userInfo.id,
      installId: this._userInfo.installId,
      timestamp: this._userInfo.timestamp
    })
    const keystore = this._userInfo.keystore;
    const pk = PaperWallet.recoverFromJson(keystore, password);
    const seed = PaperWallet.magicSeed(pk);
    return seed;
  }
  
  /**
   * getExtendedPublicKey
   * @returns {string} extPK
   */
  async getExtendedPublicKey() {
    const seed = await this._getSeedByKeyStore();
    const extPK = PaperWallet.getExtendedPublicKey(Buffer.from(seed));
    return extPK;
  }

  //////////////////////////////////////////////////////////////////////

  // /**
  //  * 
  //  * @param {object} param
  //  * @param {object} param.keyPath
  //  * @param {number} param.keyPath.chainIndex
  //  * @param {number} param.keyPath.keyIndex
  //  * @param {Buffer} param.buffer -  hash data buffer
  //  * @returns 
  //  */
  // async sign({ keyPath, buffer }) {
  //   return this._signer.sign(buffer, keyPath.chainIndex, keyPath.keyIndex);
  // }

  /**
   * 
   * @param {object} param
   * @param {string} param.keyPath
   * @param {Buffer} param.data -  hash data buffer
   * @returns 
   */
  async signBuffer({ keyPath, data }) {
    const {chainIndex, keyIndex, options} = Cryptor.pathParse(keyPath);
    const seed = await this._getSeedByKeyStore();
    const privateKey = PaperWallet.getPriKey(Buffer.from(seed, 'hex'), chainIndex, keyIndex, options);
    return Signer._sign(data, Buffer.from(privateKey, 'hex'));
  }

  async signData({ keyPath, jsonData }) {
    return true;
  }

  async signTransaction({ keyPath, coinType, value, data }) {
    return true;
  }
}

module.exports = TideWalletCore;
