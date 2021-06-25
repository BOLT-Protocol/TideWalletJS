const { utils } = require("web3");
const EthUtils = require('ethereumjs-util');
const { BN } = EthUtils;

// ++ use native functions

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

  static pathParse(keyPath) {
    if (typeof keyPath !== 'string') throw new Error('keyPath should be string');
    // keyPath = "m/84'/3324'/0'/0/0"

    const arr = keyPath.split('/');
    const chainIndex = arr[4];
    const keyIndex = arr[5];
    const options = {
      path: `${arr[0]}/${arr[1]}/${arr[2]}`,
    }
    return { chainIndex, keyIndex, options };
  }
}

module.exports = Cryptor;
