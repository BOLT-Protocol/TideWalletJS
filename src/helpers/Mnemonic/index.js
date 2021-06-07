const bip39 = require("bip39");

class Mnemonic {
  /**
   * @method checkMnemonicVaildity
   * @param {string} mnemonic
   * @returns {boolean} valid
   */
  checkMnemonicVaildity(mnemonic) {
    return bip39.validateMnemonic(mnemonic);
  }

  /**
   * @method mnemonicToSeed
   * @param {string} mnemonic
   * @returns {Buffer} seed
   */
  mnemonicToSeed(mnemonic) {
    const seed = bip39.mnemonicToSeedSync(mnemonic);
    return seed;
  }
}

module.exports = Mnemonic;
