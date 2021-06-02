const keythereum = require("keythereum");
const bitcoin = require("bitcoinjs-lib");

class PaperWallet {
  static EXT_PATH = "m/84'/3324'/0'";
  static EXT_CHAININDEX = 0;
  static EXT_KEYINDEX = 0;

  static createWallet() {}

  static recoverFromJson() {}

  static updatePassword() {}

  static magicSeed() {}

  static getPubKey(seed) {}

  static getPriKey(seed) {}

  static getExtendedPublicKey(seed) {
    let root = bitcoin.bip32.fromSeed(seed);
    root = root.derivePath(PaperWallet.EXT_PATH);

    const xPub = root.neutered().toBase58();

    console.log(xPub);

    return xPub;
  }

  static walletToJson() {}

  static jsonToWallet() {}
}

module.exports = PaperWallet;
