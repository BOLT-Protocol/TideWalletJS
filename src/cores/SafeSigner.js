class SafeSigner {
  constructor(signFunction) {
    this.signFunction = signFunction;
  }

  async sign(data) {
    return await this.signFunction(data);
  }
}

module.exports = SafeSigner;
