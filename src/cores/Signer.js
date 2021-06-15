const EthUtils = require('ethereumjs-util');
const { BN, ecsign } = EthUtils;

const User = require('./User');

const ZERO32 = Buffer.alloc(32, 0);
const EC_GROUP_ORDER = Buffer.from('fffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141', 'hex');

const THROW_BAD_HASH = 'Expected Hash';
const THROW_BAD_PRIVATE = 'Expected Private';

class Signer {
  static instance;

  /**
   * 
   * @param {User} user 
   * @returns 
   */
  constructor(user) {
    if (!Signer.instance) {
      this._user = user;
      Signer.instance = this;
    }

    return Signer.instance;
  }

  _isScalar(x) {
    return x.length == 32;
  }

  _compare(a, b) {
    const aa = new BN(a);
    const bb = new BN(b);
    if (aa.eq(bb)) return 0;
    if (aa.gt(bb)) return 1;
    return -1;
  }

  _isPrivate(x) {
    if (!this._isScalar(x)) return false;
    return this._compare(x, ZERO32) > 0 && // > 0
        this._compare(x, EC_GROUP_ORDER) < 0; // < G
  }

  _sign(hashData, privateKey) {
    if(!Buffer.isBuffer(hashData) || !this._isScalar(hashData)) throw new Error(THROW_BAD_HASH);
    if(!Buffer.isBuffer(privateKey) || !this._isPrivate(privateKey)) throw new Error(THROW_BAD_PRIVATE);

    const sig = ecsign(hashData, privateKey);
    return sig;
  }

  async sign(hashData, password, chainIndex, keyIndex, options = {}) {
    const privateKey = await this._user.getPriKey(password, chainIndex, keyIndex, options);
    if (privateKey) {
      return this._sign(
        hashData,
        Buffer.from(privateKey, 'hex')
      );
    }
  }
}

module.exports = Signer;
