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
}

module.exports = Cryptor;
