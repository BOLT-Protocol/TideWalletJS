/**
 @abstract
**/
class TransactionService {
  constructor(TideWalletCore, account) {
   
    this._TideWalletCore = TideWalletCore;
    this._account = account;
    this._accountDecimals = account.decimals;
    this._accountPath = `m/${account.purpose}'/${account.accountCoinType}'/${account.accountIndex}'`;
    console.log(this._accountDecimals);
    console.log(this._accountPath);
  }

  _base;

  set base(base) {
    this._base = base;
  }

  get base() {
    return this._base;
  }

  set accountDecimals(decimal) {
    this._accountDecimals = decimal;
  }

  get accountDecimals() {
    return this._accountDecimals;
  }

  safeSigner(changeIndex, keyIndex) {
    let signer = this._TideWalletCore.getSafeSigner(
      `${this._accountPath}/${changeIndex}/${keyIndex}`
    )
    console.log(signer)
    return signer;
  }

  verifyAddress(address, publish = true) {}
  verifyAmount(balance, amount) {}
  extractAddressData(address, publish = true) {}
  prepareTransaction() {}
}

module.exports = TransactionService;
