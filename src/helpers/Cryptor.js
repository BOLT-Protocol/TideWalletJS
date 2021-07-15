const { randomHex } = require("./utils");
const { Keccak } = require("sha3");
const hash = new Keccak(256);
const crypto = require('crypto');

class Cryptor {
  static keccak256round(str, round = 2) {
    let result = str.replace("0x", "");

    if (round > 0) {
      hash.reset();
      result = "0x" + hash.update(result, "hex").digest("hex");
      return Cryptor.keccak256round(result, round - 1);
    }

    return result;
  }

  static randomBytes(length) {
    let hexStr = "";
    if (length > 0) {
      hexStr = randomrHex(length);
    }
    return Buffer.from(hexStr, "hex");
  }

  static pathParse(keyPath) {
    if (typeof keyPath !== "string")
      throw new Error("keyPath should be string");
    // keyPath = "m/84'/3324'/0'/0/0"

    const arr = keyPath.split("/");
    const chainIndex = arr[4];
    const keyIndex = arr[5];
    const options = {
      path: `${arr[0]}/${arr[1]}/${arr[2]}/${arr[3]}`,
    };
    return { chainIndex, keyIndex, options };
  }

  /**
   * @param {Buffer} data 
   * @param {Number} round 
   * @returns {Buffer}
   */
  static sha256round(data, round = 2) {
    let result = data;
    if (round > 0) {
      const hash = crypto.createHash('sha256');
      hash.update(data);
      result = hash.digest();
      return Cryptor.sha256round(result, round - 1);
    }
    return result;
  }

  /**
   * return ripemd160 hash data
   * @param {Buffer} data
   */
   static ripemd160(data) {
    const hash = crypto.createHash('ripemd160');
    hash.update(data);
    return hash.digest();
  }

  /**
   * @param {Buffer} data 
   * @returns 
   */
  static hash160(data) {
    return Cryptor.ripemd160(Cryptor.sha256round(data, 1));
  }
}

module.exports = Cryptor;
