class SafeSigner {
  constructor(signFunction) {
    this.signFunction = signFunction;
  }

  sign(data) {
    console.log(data)
    return this.signFunction(data);
  }
}

module.exports = SafeSigner;
