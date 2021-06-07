const Cryptor = require('./../helpers/Cryptor');
const rlp = require('./../helpers/rlp');

class User {  
  constructor() {
    this.id = null;
    this.thirdPartyId = null;
    this.installId = null;
    this.timestamp = null;
    this.isBackup = false;
  }

  /**
   * check user
   * @returns {boolean}
   */
  checkUser() {
    // TODO: find user table
    const user = ''
    if (user != null) {
      this._initUser(user);
      return true;
    }
    return false
  }

  /**
   * get nonce
   * @param {String} userIdentifierBuffer
   * @returns {boolean}
   */
  // comment is for test
  _getNonce(userIdentifier, nonce) {
    // const cafeca = 0xcafeca;
    // let nonce = cafeca;

    const getString = (nonce) => Cryptor
      .keccak256round(userIdentifier, rlp.toBuffer(nonce), 1)
      .slice(0, 3)
      .toLowerCase();

    return getString(nonce)
    if (getString(nonce) === 'cfc')
    return rlp.toBuffer(nonce);
    // while (getString(nonce) != 'cfc') {
    //   nonce =`0x${(Number(nonce)+1).toString(16)}`
    // }
    // return rlp.toBuffer(nonce);
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
  getPassword({ userIdentifier, userId, installId, timestamp}) {
    const pwseed = Cryptor.keccak256round(
      Cryptor.keccak256round(
        Cryptor.keccak256round(userIdentifier || this.thirdPartyId, 1) + 
        Cryptor.keccak256round(userId || this.id, 1)
      ) +
      Cryptor.keccak256round(
        rlp.toBuffer(rlp.toBuffer(timestamp).slice(3, 6)) + 
        Cryptor.keccak256round(installId || this.installId, 1)
      )
    )
    const password = Cryptor.keccak256round(pwseed);
    return password;
  }

  /**
   * generate Credential Data
   * @param {Object} userInfo
   * @param {String} userInfo.userIdentifier
   * @param {String} userInfo.userId
   * @param {String} userInfo.userSecret
   * @param {String} userInfo.installId
   * @param {Number} userInfo.timestamp
   * @returns {String} password
   */
  _generateCredentialData({ userIdentifier, userId, userSecret, installId, timestamp}) {
    const nonce = this._getNonce(userIdentifier);

    const main = (Number(userIdentifier) + Number(nonce)).toString(16).slice(0, 4)
    const extend = Cryptor.keccak256round(nonce, 1).slice(0, 4);
    const seed = Cryptor.keccak256round(
      Cryptor.keccak256round(
        Cryptor.keccak256round(main, 1) +
        Cryptor.keccak256round(extend, 1)
      ) +
      Cryptor.keccak256round(
        Cryptor.keccak256round(userId, 1) +
        Cryptor.keccak256round(userSecret, 1)
      )
    );

    const key = Cryptor.keccak256round(seed);
    const password = this.getPassword({ userIdentifier, userId, installId, timestamp });
    const extend = hex.encode(extendBuffer);

    return { key, password, extend};
  }

  /**
   * generate Credential Data
   * @param {Object} userInfo
   * @param {String} userInfo.userIdentifier
   * @param {String} userInfo.userId
   * @param {String} userInfo.userSecret
   * @param {String} userInfo.installId
   * @param {Number} userInfo.timestamp
   * @returns {String} password
   */
  createUser() {}

  _getUser() {}

  _registerUser() {}

  createUserWithSeed() {}

  verifyPassword() {}

  updatePassword() {}

  validPaperWallet() {}

  restorePaperWallet() {}

  restoreUser() {}

  checkWalletBackup() {}

  backupWallet() {}

  /**
   * init user
   * @method createWallet
   * @param {object} user - db user table
   */
  _initUser() {
    this.id = user.userId
    this.thirdPartyId = user.thirdPartyId;
    this.installId = user.installId;
    this.timestamp = user.timestamp;
    this.isBackup = user.backupStatus;

    // TODO: _prefManager.getAuthItem and check is auth, or HTTPAgent().setToken(token);
  }

  _seasonedPassword() {}

  getKeystore() {}

  deleteUser() {}
}

module.exports = User;
