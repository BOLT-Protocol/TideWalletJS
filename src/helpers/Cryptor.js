const { randomHex } = require("./helper");
const { Keccak } = require("sha3");
const hash = new Keccak(256);

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
      hexStr = randomHex(length);
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
      path: `${arr[0]}/${arr[1]}/${arr[2]}`,
    };
    return { chainIndex, keyIndex, options };
  }
}

module.exports = Cryptor;
