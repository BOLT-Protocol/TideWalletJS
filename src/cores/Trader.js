const BigNumber = require('bignumber.js');

class Trader {
  static syncInterval = 24 * 60 * 60 * 1000;
  static instance;

  constructor({TideWalletCommunicator, DBOperator}) {
    if (!Trader.instance) {
      this._fiats = [];
      this._cryptos = [];

      this._TideWalletCommunicator = TideWalletCommunicator;
      this._DBOperator = DBOperator;
      Trader.instance = this;
    }

    return Trader.instance;
  }

  async getFiatList() {
    const local = await this._DBOperator.exchangeRateDao.findAllExchageRates();
    const now = Date.now();

    if (!Array.isArray(local) || !local[0] || now - local[0].lastSyncTime > Trader.syncInterval) {
      try {
        const works = [
          this._TideWalletCommunicator.FiatsRate(),
          this._TideWalletCommunicator.CryptoRate()
        ]
        const res = await Promise.all(works);
        const fiats = res[0];
        const cryptos = res[1];
        const rates = [
          ...fiats.map(
            (e) => this._DBOperator.exchangeRateDao.entity({
              ...e, timestamp: now, type: 'fiat',
            })
          ),
          ...cryptos.map(
            (e) => this._DBOperator.exchangeRateDao.entity({
              ...e, timestamp: now, type: 'currency',
            })
          )
        ];
        await this._DBOperator.exchangeRateDao.insertExchangeRates(rates);

        this._fiats = fiats
          .map((r) => ({
            currencyId: r.currency_id,
            name: r.name,
            exchangeRate: new BigNumber(r.rate),
          }));
        this._cryptos = cryptos
          .map((r) => ({
            currencyId: r.currency_id,
            name: r.name,
            exchangeRate: new BigNumber(r.rate),
          }));
      } catch (error) {
        console.log(error);
      }
    } else {
      this._fiats = local
        .filter((rate) => rate.type === 'fiat')
        .map((r) => ({
          currencyId: r.exchangeRateId,
          name: r.name,
          exchangeRate: new BigNumber(r.rate),
        }));
      this._cryptos = local
        .filter((rate) => rate.type === 'currency')
        .map((r) => ({
          currencyId: r.exchangeRateId,
          name: r.name,
          exchangeRate: new BigNumber(r.rate),
        }));
    }

    return this._fiats;
  }

  /**
   * 
   * @param {object} fiat
   * @param {string} fiat.name
   */
  setSelectedFiat(fiat) {
    this._DBOperator.prefDao.setSelectedFiat(fiat.name);
  }

  async getSelectedFiat() {
    const name = await this._DBOperator.prefDao.getSelectedFiat();

    if (name == null || name == undefined) return this._fiats[0];

    const fiat = this._fiats.find((f) => f.name === name);
    return fiat;
  }

  /**
   * calculateToUSD
   * @param {object} _currency
   * @param {string} _currency.currencyId
   * @param {BigNumber} _currency.amount
   * @returns {BigNumber} 
   */
  calculateToUSD(_currency) {
    const crypto = this._cryptos.find((c) => c.currencyId === _currency.currencyId);
    if (!crypto) return new BigNumber(0);

    const bnAmount = _currency.amount;
    const bnExCh = new BigNumber(crypto.exchangeRate);
    return bnAmount.multipliedBy(bnExCh);
  }

  /**
   * calculateUSDToCurrency
   * @param {object} _currency
   * @param {string} _currency.currencyId
   * @param {BigNumber} amountInUSD 
   * @returns {BigNumber}
   */
  calculateUSDToCurrency(_currency, amountInUSD) {
    const crypto = this._cryptos.find((c) => c.currencyId === _currency.currencyId);
    if (!crypto) return new BigNumber(0);

    const bnAmountInUSD = amountInUSD;
    const bnExCh = new BigNumber(crypto.exchangeRate);
    return bnAmountInUSD.dividedBy(bnExCh);
  }

  /**
   * calculateAmountToUSD
   * @param {object} _currency
   * @param {string} _currency.currencyId
   * @param {BigNumber} amount 
   * @returns {BigNumber}
   */
  calculateAmountToUSD(_currency, amount) {
    const crypto = this._cryptos.find((c) => c.currencyId === _currency.currencyId);
    if (!crypto) return new BigNumber(0);

    const bnAmount = amount;
    const bnExCh = new BigNumber(crypto.exchangeRate);
    return bnAmount.multipliedBy(bnExCh);
  }

  /**
   * 
   * @param {object} sellCurrency
   * @param {string} sellCurrency.currencyId
   * @param {object} buyCurrency
   * @param {string} buyCurrency.currencyId
   * @param {BigNumber} sellAmount 
   * @returns {object} result
   * @returns {BigNumber} result.buyAmount
   * @returns {BigNumber} result.exchangeRate
   */
  getSwapRateAndAmount(sellCurrency, buyCurrency, sellAmount) {
    // const sellCryptos = this._cryptos.find((c) => c.currencyId == sellCurrency.currencyId);
    // const buyCryptos = this._cryptos.find((c) => c.currencyId == buyCurrency.currencyId);
    // console.log(
    //     `sellCryptos ${sellCryptos.name} [${sellCryptos.currencyId}]: ${sellCryptos.exchangeRate}`);
    // console.log(
    //     `buyCryptos ${buyCryptos.name} [${buyCryptos.currencyId}]: ${buyCryptos.exchangeRate}`);

    const exchangeRate = this.calculateUSDToCurrency(buyCurrency, this.calculateAmountToUSD(sellCurrency, new BigNumber(1)));
    const buyAmount = this.calculateUSDToCurrency(buyCurrency, sellAmount.multipliedBy(exchangeRate));
    console.log('buyAmount.toFixed():', buyAmount.toFixed())
    console.log('exchangeRate.toFixed():', exchangeRate.toFixed())
    return {buyAmount, exchangeRate};
  }
}

module.exports = Trader;
