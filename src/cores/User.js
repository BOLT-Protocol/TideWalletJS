const Cryptor = require('./../helpers/Cryptor');
const rlp = require('./../helpers/rlp');
// const PaperWallet = require('./PaperWallet');
const HTTPAgent = require('./../helpers/httpAgent');
const config = require('./../constants/config');

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
   * @param {String} userIdentifier
   * @returns {String}
   */
  _getNonce(userIdentifier) {
    const cafeca = 0xcafeca;
    let nonce = cafeca;

    const getString = (nonce) => Cryptor
      .keccak256round(
        Buffer.concat([
          Buffer.from(userIdentifier, 'utf8'), 
          rlp.toBuffer(nonce)
        ]).toString('hex')
      , 1)
      .slice(0, 3)
      .toLowerCase();

    while (getString(nonce) != 'cfc') {
      nonce = Number(nonce)+1
    }

    return nonce
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
    const pwseed = Cryptor.keccak256round(
      Buffer.concat([
        Buffer.from(Cryptor.keccak256round(
          Buffer.concat([
            Buffer.from(Cryptor.keccak256round(userIdentifier || this.thirdPartyId, 1)),
            Buffer.from(Cryptor.keccak256round(userId || this.id, 1))
          ]).toString('hex')
        )),
        Buffer.from(Cryptor.keccak256round(
          Buffer.concat([
            Buffer.from(Cryptor.keccak256round(
              rlp.toBuffer(rlp.toBuffer(timestamp).toString('hex').slice(3, 6)).toString('hex'), 1
            )),
            Buffer.from(Cryptor.keccak256round(installId || this.installId, 1))
          ]).toString('hex')
        ))
      ]).toString('hex')
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
   * @returns {Object} result 
   * @returns {String} result.key
   * @returns {String} result.password
   * @returns {String} result.extend
   */
  _generateCredentialData({ userIdentifier, userId, userSecret, installId, timestamp}) {
    const nonce = this._getNonce(userIdentifier);

    const _main = (Number(userIdentifier) + Number(nonce)).toString(16).slice(0, 4)
    const _extend = Cryptor.keccak256round(nonce, 1).slice(0, 4);
    const seed = Cryptor.keccak256round(
      Cryptor.keccak256round(
        Cryptor.keccak256round(_main, 1) +
        Cryptor.keccak256round(_extend, 1)
      ) +
      Cryptor.keccak256round(
        Cryptor.keccak256round(userId, 1) +
        Cryptor.keccak256round(userSecret, 1)
      )
    );

    const key = Cryptor.keccak256round(seed);
    const password = this.getPassword({ userIdentifier, userId, installId, timestamp });

    return { key, password, extend: `0x${_extend}` };
  }

  /**
   * create user
   * @param {String} userIdentifier
   * @returns {} success
   */
  async createUser(userIdentifier) {
    // TODO: const installId = await this._prefManager.getInstallationId();
    const installId = ''

    const user = await this._getUser(userIdentifier)
    const userId = user[0];
    const userSecret = user[1];
    const timestamp = Math.floor(new Date() / 1000)
    const credentialData = this._generateCredentialData({ userIdentifier, userId, userSecret, installId, timestamp })

    const wallet = await PaperWallet.createWallet(credentialData);
    const seed = await PaperWallet.magicSeed(wallet.privateKey.privateKey);
    const extPK = PaperWallet.getExtendedPublicKey(seed);

    const success = await this._registerUser({
      extendPublicKey: extPK,
      installId,
      wallet,
      userId,
      userIdentifier,
      timestamp,
    });

    return success;
  }


  /**
   * get user
   * @param {String} userIdentifier
   * @returns {String[]} [userId, userSecret]
   */
  async _getUser(userIdentifier) {
    let userId = ''
    let userSecret = ''

    const _res = await HTTPAgent().post(config.url + '/user/id', {"id": userIdentifier});
    if (_res.success) {
      userId = _res.data['user_id'];
      userSecret = _res.data['user_secret'];

      return [userId, userSecret];
    } else {
      return [];
    }
  }

  async _registerUser({ extendPublicKey, installId, wallet, userId, userIdentifier, timestamp }) {
    const payload = {
      wallet_name: "TideWallet3", // ++ inform backend to update [Emily 04/01/2021]
      extend_public_key: extendPublicKey,
      install_id: installId,
      app_uuid: installId,
      fcm_token: ''
    };

    const res = await HTTPAgent().post(`${config.url}/user`, payload);

    if (res.success) {
      // TODO:
      // this._prefManager.setAuthItem(AuthItem.fromJson(res.data));

      const keystore = await PaperWallet.walletToJson(wallet);

      // const user = UserEntity(
      //     // res.data['user_id'], // ++ inform backend to update userId become radom hex[Emily 04/01/2021]
      //     userId,
      //     keystore,
      //     userIdentifier,
      //     installId,
      //     timestamp,
      //     false);
      // await DBOperator().userDao.insertUser(user);

      // await this._initUser(user);
    }

    return res.success;
  }

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
  _initUser(user) {
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
