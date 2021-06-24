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
        const fiats = await this._TideWalletCommunicator.FiatsRate();
        const cryptos = await this._TideWalletCommunicator.CryptoRate();
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

        this._fiats = fiats;
        this._cryptos = cryptos;
      } catch (error) {
        console.log(error);
      }
    } else {
      this._fiats = local
        .where((rate) => rate.type === 'fiat')
        .map((r) => {
          delete r.type;
          delete r.timestamp;
        });

      this._cryptos = local
        .where((rate) => rate.type === 'currency')
        .map((r) => {
          delete r.type;
          delete r.timestamp;
        });
    }

    return this._fiats;
  }

  setSelectedFiat(fiat) {
    this._DBOperator.prefDao.setSelectedFiat(fiat.name);
  }

  async getSelectedFiat() {
    const name = await this._DBOperator.prefDao.getSelectedFiat();

    if (name == null || name == undefined) return this._fiats[0];

    const fiat = this._fiats.find((f) => f.name === name) || this._fiats[0];
    return fiat;
  }

  calculateToUSD(_currency) {
    const crypto = this._cryptos.find((c) => c.currencyId === _currency.currencyId);
    if (!crypto) return '0';

    const bnAmount = new BigNumber(_currency.amount);
    const bnExCh = new BigNumber(crypto.exchangeRate);
    return bnAmount.multipliedBy(bnExCh).toFixed();
  }

  calculateUSDToCurrency(_currency, amountInUSD) {
    const crypto = this._cryptos.find((c) => c.currencyId === _currency.currencyId);
    if (!crypto) return '0';

    const bnAmountInUSD = new BigNumber(amountInUSD);
    const bnExCh = new BigNumber(crypto.exchangeRate);
    return bnAmountInUSD.dividedBy(bnExCh).toFixed();
  }

  calculateAmountToUSD(_currency, amount) {
    const crypto = this._cryptos.find((c) => c.currencyId === _currency.currencyId);
    if (!crypto) return '0';

    const bnAmount = new BigNumber(amount);
    const bnExCh = new BigNumber(crypto.exchangeRate);
    return bnAmount.multipliedBy(bnExCh).toFixed();
  }

  getSwapRateAndAmount(sellCurrency, buyCurrency, sellAmount) {
    // const sellCryptos = this._cryptos.find((c) => c.currencyId == sellCurrency.currencyId);
    // const buyCryptos = this._cryptos.find((c) => c.currencyId == buyCurrency.currencyId);
    // console.log(
    //     `sellCryptos ${sellCryptos.name} [${sellCryptos.currencyId}]: ${sellCryptos.exchangeRate}`);
    // console.log(
    //     `buyCryptos ${buyCryptos.name} [${buyCryptos.currencyId}]: ${buyCryptos.exchangeRate}`);

    const exchangeRate = this.calculateUSDToCurrency(buyCurrency, this.calculateAmountToUSD(sellCurrency, 1));
    const buyAmount = this.calculateUSDToCurrency(buyCurrency, new BigNumber(sellAmount).multipliedBy(new BigNumber(exchangeRate)));
    return {"buyAmount": buyAmount, "exchangeRate": exchangeRate};
  }
}

module.exports = Trader;
