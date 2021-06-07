const { utils } = require("web3");

class Cryptor {
  static keccak256round(str, round = 2) {
    let result = str.replace('0x', '');

    if (round > 0) {
      result = utils.sha3('0x' + result);
      return Cryptor.keccak256round(result, round - 1);
    }

    return result;
  }

  static randomBytes(length) {
    let hexStr = '';
    if (length > 0) {
      hexStr = utils.randomHex(length).substr(2);
    }
    return Buffer.from(hexStr, 'hex');
  }

  /**
  * get compressed Key from uncompressed Key
  * @param  Buffer uncomperedKey
  * @return String
  */
   static compressedKey(uncomperedKey) {
    if (typeof uncomperedKey === 'string') uncomperedKey = Buffer.from(uncomperedKey, 'hex')
    if (uncomperedKey.length % 2 === 1) {
      uncomperedKey = uncomperedKey.slice(1, uncomperedKey.length);
    }

    const x = uncomperedKey.slice(0, 32);
    const y = uncomperedKey.slice(32, 64);

    const bnP = new BN('fffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2f', 16);

    const bnX = new BN(x.toString('hex'), 16);
    const bnY = new BN(y.toString('hex'), 16);

    const check = bnX.pow(new BN(3)).add(new BN(7)).sub((bnY.pow(new BN(2)))).mod(bnP);

    if (!check.isZero()) return 'Error';
    const prefix = bnY.isEven() ? '02' : '03';
    const compressed = Buffer.concat([Buffer.from(prefix, 'hex'), x]);

    return compressed.toString('hex');
  }
}

module.exports = Cryptor;
