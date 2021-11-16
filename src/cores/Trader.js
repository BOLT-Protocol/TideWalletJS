const SafeMath = require("../helpers/SafeMath");

class Trader {
  static syncInterval = 24 * 60 * 60 * 1000; // for wallet to sync rate

  constructor({ TideWalletCommunicator, DBOperator }) {
    this._fiats = [];
    this._cryptos = [];

    this._TideWalletCommunicator = TideWalletCommunicator;
    this._DBOperator = DBOperator;
    return this;
  }

  async getFiatList() {
    const local = await this._DBOperator.exchangeRateDao.findAllExchageRates();
    const now = Date.now();

    if (
      !Array.isArray(local) ||
      !local[0] ||
      now - local[0].lastSyncTime > Trader.syncInterval
    ) {
      try {
        const res = await this.getRateFromBackend();
        const fiats = res[0];
        const cryptos = res[1];
        const rates = [
          ...fiats.map((e) =>
            this._DBOperator.exchangeRateDao.entity({
              ...e,
              timestamp: now,
              type: "fiat",
            })
          ),
          ...cryptos.map((e) =>
            this._DBOperator.exchangeRateDao.entity({
              ...e,
              timestamp: now,
              type: "currency",
            })
          ),
        ];
        await this._DBOperator.exchangeRateDao.insertExchangeRates(rates);

        this._fiats = fiats.map((r) => ({
          currencyId: r.currency_id,
          name: r.name,
          exchangeRate: r.rate,
        }));
        this._cryptos = cryptos.map((r) => ({
          currencyId: r.currency_id,
          name: r.name,
          exchangeRate: r.rate,
        }));
      } catch (error) {
        console.log(error);
      }
    } else {
      this._fiats = local
        .filter((rate) => rate.type === "fiat")
        .map((r) => ({
          currencyId: r.exchangeRateId,
          name: r.name,
          exchangeRate: r.rate,
        }));
      this._cryptos = local
        .filter((rate) => rate.type === "currency")
        .map((r) => ({
          currencyId: r.exchangeRateId,
          name: r.name,
          exchangeRate: r.rate,
        }));
    }

    return this._fiats;
  }

  async getRateFromBackend() {
    const works = [
      this._TideWalletCommunicator.fiatsRate(),
      this._TideWalletCommunicator.cryptoRate(),
    ];
    const res = await Promise.all(works);
    return res;
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
    
    if (this._fiats.length === 0) {
      await this.getFiatList();
    }

    if (name == null || name == undefined) return this._fiats[0];

    const fiat = this._fiats.find((f) => f.name === name);
    return fiat;
  }

  /**
   * calculateToUSD
   * @param {object} account
   * @param {string} account.amount
   * @returns {string}
   */
  calculateToFiat(account, fiat) {
    const amountInUSD = SafeMath.mult(
      account.balance,
      account.exchangeRate ?? "0"
    );

    const amountInFiat = SafeMath.mult(amountInUSD, fiat.exchangeRate);

    return amountInFiat;
  }

  /**
   * calculateToUSD
   * @param {object} _currency
   * @param {string} _currency.currencyId
   * @param {string} _currency.amount
   * @returns {string}
   */
  calculateToUSD(_currency) {
    const crypto = this._cryptos.find(
      (c) => c.currencyId === _currency.currencyId
    );
    if (!crypto) return "0";

    return SafeMath.mult(_currency.amount, crypto.exchangeRate);
  }

  /**
   * calculateUSDToCurrency
   * @param {object} _currency
   * @param {string} _currency.currencyId
   * @param {string} amountInUSD
   * @returns {string}
   */
  calculateUSDToCurrency(_currency, amountInUSD) {
    const crypto = this._cryptos.find(
      (c) => c.currencyId === _currency.currencyId
    );
    if (!crypto) return new "0"();

    return SafeMath.div(amountInUSD, crypto.exchangeRate);
  }

  /**
   * calculateAmountToUSD
   * @param {object} _currency
   * @param {string} _currency.currencyId
   * @param {string} amount
   * @returns {string}
   */
  calculateAmountToUSD(_currency, amount) {
    const crypto = this._cryptos.find(
      (c) => c.currencyId === _currency.currencyId
    );
    if (!crypto) return "0";

    return SafeMath.mult(amount, crypto.exchangeRate);
  }

  /**
   *
   * @param {object} sellCurrency
   * @param {string} sellCurrency.currencyId
   * @param {object} buyCurrency
   * @param {string} buyCurrency.currencyId
   * @param {string} sellAmount
   * @returns {object} result
   * @returns {string} result.buyAmount
   * @returns {string} result.exchangeRate
   */
  getSwapRateAndAmount(sellCurrency, buyCurrency, sellAmount) {
    // const sellCryptos = this._cryptos.find((c) => c.currencyId == sellCurrency.currencyId);
    // const buyCryptos = this._cryptos.find((c) => c.currencyId == buyCurrency.currencyId);
    // console.log(
    //     `sellCryptos ${sellCryptos.name} [${sellCryptos.currencyId}]: ${sellCryptos.exchangeRate}`);
    // console.log(
    //     `buyCryptos ${buyCryptos.name} [${buyCryptos.currencyId}]: ${buyCryptos.exchangeRate}`);

    const exchangeRate = this.calculateUSDToCurrency(
      buyCurrency,
      this.calculateAmountToUSD(sellCurrency, "1")
    );
    const buyAmount = this.calculateUSDToCurrency(
      buyCurrency,
      SafeMath.mult(sellAmount, exchangeRate)
    );
    console.log("buyAmount:", buyAmount);
    console.log("exchangeRate:", exchangeRate);
    return { buyAmount, exchangeRate };
  }
}

module.exports = Trader;
