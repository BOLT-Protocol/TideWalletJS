class Signer {
  static instance;

  constructor() {
    if (!Signer.instance) {
      Signer.instance = this;
    }

    return Signer.instance;
  }

  sign() {}
}

module.exports = Signer;
