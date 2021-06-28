class SafeSigner {
  constructor(signFunction) {
    this.signFunction = signFunction;
  }

  sign(data) {
    return this.signFunction(data);
  }
}

module.exports = SafeSigner;