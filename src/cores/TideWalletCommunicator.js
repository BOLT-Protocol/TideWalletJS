const HTTPAgent = require('./../helpers/httpAgent');
const Code = require("./Codes");
const JWT = require('jsonwebtoken');

class TideWalletCommunicator {

  constructor ({ apiURL, apiKey, apiSecret }) {
    if (!apiURL) throw new Error('Invalid apiURL');
    if (!apiKey) throw new Error('Invalid apiKey');
    if (!apiSecret) throw new Error('Invalid apiSecret');
    this.apiURL = apiURL;
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    this.httpAgent = new HTTPAgent({ apiURL });

    this.token;
    this.tokenSecret;
    this.tokenRenewTimeout;
    return this;
  }

  // 0. Get User ID and Secret
  /**
   * oathRegister
   * @param {string} installID 
   * @param {*} appUUID 
   * @param {*} extendPublicKey 
   * @param {*} fcmToken 
   * @returns 
   */
   async oathRegister(userIdentifier) {
    let userId = '';
    let userSecret = '';
    try {
      const body = {
        id: userIdentifier
      }
      const res = await this._post(this.apiURL + '/user/id', body);
      if (res.success) {
        userId = res.data['user_id'];
        userSecret = res.data['user_secret'];
      }
      return { userId, userSecret };
    } catch (error) {
      return Promise.reject({ message: error });
    }
  }


  // 7. User Regist
  /**
   * register
   * @param {string} installID 
   * @param {string} appUUID 
   * @param {string} extendPublicKey 
   * @param {string} fcmToken
   * @returns {
   *  token: string,
   *  tokenSecret: string,
   *  userID: string
   * }
   */
  async register(installID, appUUID, extendPublicKey, fcmToken = '') {
    try {
      const body = {
        wallet_name: 'TideWallet3',
        extend_public_key: extendPublicKey,
        install_id: installID,
        app_uuid: appUUID,
        fcm_token: fcmToken
      }
      const res = await this.httpAgent.post(this.apiURL + '/user', body);
      if (res.success) {
        this._setInfo(res.data.token, res.data.tokenSecret);
        return { success: true, token: res.data.token, tokenSecret: res.data.tokenSecret, userID: res.data.user_id };
      }
      this.token = null;
      this.tokenSecret = null;
      return Promise.reject({ message: res.message, code: res.code });
    } catch (error) {
      return Promise.reject({ message: error });
    }
  }

  // 9. User Token Verify
  /**
   * login
   * @param {string} token 
   * @param {string} tokenSecret 
   * @returns {
   *  userID: string,
   * }
   */
  async login(token, tokenSecret) {
    try {
      const res = await this.httpAgent.get(this.apiURL + '/token/verify?token=' + token);
      if (res.success) {
        this._setInfo(token, tokenSecret);
        return { userID: res.data.user_id };
      }
      this.token = null;
      this.tokenSecret = null;
      return Promise.reject({ message: res.message, code: res.code });
    } catch (error) {
      return Promise.reject({ message: error });
    }
  }

  // 1. List Supported Blockchains
  /**
   * blockchainList
   * @returns [{
   *  blockchain_id: string,
   *  name: string,
   *  coin_type: number,
   *  network_id: number,
   *  publish: boolean
   * }]
   */
  async blockchainList() {
    try {
      const res = await this._get(this.apiURL + '/blockchain');
      if (res.success) {
        return res.data;
      }
      return Promise.reject({ message: res.message, code: res.code });
    } catch (error) {
      return Promise.reject({ message: error });
    }
  }

  // 2. Get Blockchain Detail
  /**
   * blockchainDetail
   * @param {string} blockchainID 
   * @returns {
   *  blockchain_id: string,
   *  name: string,
   *  coin_type: number,
   *  network_id: number,
   *  publish: boolean
   * }
   */
  async blockchainDetail(blockchainID) {
    try {
      if (!blockchainID) return { message: 'invalid input' };
      const res = await this._get(this.apiURL + '/blockchain/' + blockchainID);
      if (res.success) {
        return res.data;
      }
      return Promise.reject({ message: res.message, code: res.code });
    } catch (error) {
      return Promise.reject({ message: error });
    }
  }

  // 3. List Supported Currencies
  /**
   * currencyList
   * @returns [{
   *  currency_id: string,
   *  blockchain_id: string,
   *  name: string,
   *  symbol: stirng,
   *  type: number,
   *  description: string,
   *  publish: boolean,
   *  address: string | null,
   *  decimals: number,
   *  total_supply: string | null,
   *  exchange_rate: string,
   *  contract: string | null,
   *  icon": string
   * }]
   */
  async currencyList() {
    try {
      const res = await this._get(this.apiURL + '/currency');
      if (res.success) {
        return res.data;
      }
      return Promise.reject({ message: res.message, code: res.code });
    } catch (error) {
      return Promise.reject({ message: error });
    }
  }

  // 4. Get Currency Detail
  /**
   * currencyDetail
   * @param {*} currencyID 
   * @returns {
   *  currency_id: string,
   *  blockchain_id: string,
   *  name: string,
   *  symbol: stirng,
   *  type: number,
   *  description: string,
   *  publish: boolean,
   *  address: string | null,
   *  decimals: number,
   *  total_supply: string | null,
   *  exchange_rate: string,
   *  contract: string | null,
   *  icon": string
   * }
   */
  async currencyDetail(currencyID) {
    try {
      if (!currencyID) return { message: 'invalid input' };
      const res = await this._get(this.apiURL + '/currency/' + currencyID);
      if (res.success) {
        return res.data;
      }
      return Promise.reject({ message: res.message, code: res.code });
    } catch (error) {
      return Promise.reject({ message: error });
    }
  }

  // 5. List Supported Tokens
  /**
   * tokenList
   * @param {string} blockchainID 
   * @returns [{
   *  currency_id: string,
   *  blockchain_id: stirng,
   *  name: string,
   *  symbol: string,
   *  type: number,
   *  description: string,
   *  publish: boolean
   *  address: string | null,
   *  decimals: number,
   *  total_supply: string,
   *  exchange_rate: string | null,
   *  contract: string,
   *  icon": string
   * }]
   */
  async tokenList(blockchainID) {
    try {
      const res = await this._get(this.apiURL + '/blockchain/' + blockchainID + '/token?type=TideWallet');
      if (res.success) {
        return res.data;
      }
      return Promise.reject({ message: res.message, code: res.code });
    } catch (error) {
      return Promise.reject({ message: error });
    }
  }

  // 6. Get Token Detail
  /**
   * tokenDetail
   * @param {string} blockchainID 
   * @param {string} currencyID 
   * @returns {
   *  currency_id: string,
   *  blockchain_id: stirng,
   *  name: string,
   *  symbol: string,
   *  type: number,
   *  description: string,
   *  publish: boolean
   *  address: string | null,
   *  decimals: number,
   *  total_supply: string,
   *  exchange_rate: string | null,
   *  contract: string,
   *  icon": string
   * }
   */
  async tokenDetail(blockchainID, currencyID) {
    try {
      const res = await this._get(this.apiURL + '/blockchain/' + blockchainID + '/token/' + currencyID);
      if (res.success) {
        return res.data;
      }
      return Promise.reject({ message: res.message, code: res.code });
    } catch (error) {
      return Promise.reject({ message: error });
    }
  }

  // 10. User Token Renew
  /**
   * accessTokenRenew
   * @returns {
   *  token: string,
   *  tokenSecret: string
   * }
   */
  async accessTokenRenew({ token, tokenSecret }) {
    try {
      const body = {
        token,
        tokenSecret
      }
      const res = await this.httpAgent.post(this.apiURL + '/token/renew', body);
      if (res.success) {
        this._setInfo(res.data.token, res.data.tokenSecret);
        return res.data;
      }
      return Promise.reject({ message: res.message, code: res.code });
    } catch (error) {
      return Promise.reject({ message: error });
    }
  }

  // 11. Account Token Regist
  /**
   * tokenRegist
   * @param {string} blockchainID 
   * @param {string} contractAddress 
   * @returns {
   *  token_id: string
   * }
   */
  async tokenRegist(blockchainID, contractAddress) {
    try {
      if (!blockchainID || !contractAddress) return { message: 'invalid input' };
      if (!this.httpAgent.getToken()) return { message: 'need login' };

      const res = await this._post(this.apiURL + '/wallet/blockchain/' + blockchainID + '/contract/' + contractAddress, {});
      if (res.success) {
        return res.data;
      }
      return Promise.reject({ message: res.message, code: res.code });
    } catch (error) {
      return Promise.reject({ message: error });
    }
  }

  // 12. Get Account List
  /**
   * accountList
   * @returns [{
   *  blockchain_id: string,
   *  currency_id: string,
   *  purpose: number,
   *  account_index: string,
   *  curve_type: number,
   *  number_of_external_key: number,
   *  number_of_internal_key: number,
   *  balance: string,
   *  tokens: [tokenDetail]
   * }]
   */
  async accountList() {
    try {
      if (!this.httpAgent.getToken()) return { message: 'need login' };

      console.log(this.apiURL + '/wallet/accounts');
      const res = await this._get(this.apiURL + '/wallet/accounts');
      if (res.success) {
        return res.data;
      }
      return Promise.reject({ message: res.message, code: res.code });
    } catch (error) {
      return Promise.reject({ message: error });
    }
  }

  // 13. Get Account Detail
  /**
   * accountDetail
   * @param {string} accountID 
   * @returns {
   *  blockchain_id: string,
   *  currency_id: string,
   *  purpose: number,
   *  account_index: string,
   *  curve_type: number,
   *  number_of_external_key: number,
   *  number_of_internal_key: number,
   *  balance: string,
   *  tokens: [tokenDetail]
   * }
   */
  async accountDetail(accountID) {
    try {
      if (!accountID) return { message: 'invalid input' };
      if (!this.httpAgent.getToken()) return { message: 'need login' };

      const res = await this._get(this.apiURL + '/wallet/account/' + accountID);
      if (res.success) {
        return res.data;
      }
      return Promise.reject({ message: res.message, code: res.code });
    } catch (error) {
      return Promise.reject({ message: error });
    }
  }

  // 14. Get Receive Address
  /**
   * accountReceive
   * @param {string} accountID 
   * @returns {
   *  address: string,
   *  keyIndex: number
   * }
   */
  async accountReceive(accountID) {
    try {
      if (!accountID) return { message: 'invalid input' };
      if (!this.httpAgent.getToken()) return { message: 'need login' };

      const res = await this._get(this.apiURL + '/wallet/account/address/' + accountID + '/receive');
      if (res.success) {
        return res.data;
      }
      return Promise.reject({ message: res.message, code: res.code });
    } catch (error) {
      return Promise.reject({ message: error });
    }
  }

  // 15. Get Change Address
  /**
   * accountChange
   * @param {string} accountID 
   * @returns {
   *  address: string,
   *  keyIndex: number
   * }
   */
  async accountChange(accountID) {
    try {
      if (!accountID) return { message: 'invalid input' };
      if (!this.httpAgent.getToken()) return { message: 'need login' };

      const res = await this._get(this.apiURL + '/wallet/account/address/' + accountID + '/change');
      if (res.success) {
        return res.data;
      }
      return Promise.reject({ message: res.message, code: res.code });
    } catch (error) {
      return Promise.reject({ message: error });
    }
  }

  // 16. List Transactions
  /**
   * listTransactions
   * @param {string} accountID 
   * @param {string} limit 
   * @param {string} timestamp
   * @param {string} isGetOlder
   * @returns [{
   *   id: string,
   *   txid: string,
   *   status: string,
   *   confirmations: number,
   *   amount: string,
   *   blockchain_id: string,
   *   symbol: string,
   *   direction: string,
   *   timestamp: number,
   *   source_addresses: array<string>,
   *   destination_addresses: string,
   *   fee: string,
   *   gas_price: string | null,
   *   gas_used: string | null
   * }]
   */
  async listTransactions(accountID, limit = 20, timestamp = Math.floor(Date.now() / 1000), isGetOlder = 'false') {
    try {
      if (!accountID) return { message: 'invalid input' };
      if (!this.httpAgent.getToken()) return { message: 'need login' };

      const res = await this._get(this.apiURL + '/wallet/account/txs/' + accountID + '?limit=' + limit + '&timestamp=' + timestamp + '&isGetOlder=' + isGetOlder);
      if (res.success) {
        return res.data;
      }
      return Promise.reject({ message: res.message, code: res.code });
    } catch (error) {
      return Promise.reject({ message: error });
    }
  }

  // 17. Get Transaction Detail（暫時保留，與 list 資料重複性太高）
  /**
   * transactionDetail
   * @param {string} txid 
   * @returns {
   *   txid: string,
   *   status: string,
   *   confirmations: number,
   *   amount: string,
   *   blockchain_id: string,
   *   symbol: string,
   *   direction: string,
   *   timestamp: number,
   *   source_addresses: array<string>,
   *   destination_addresses: string,
   *   fee: string,
   *   gas_price: string | null,
   *   gas_used: string | null
   * }
   */
  async transactionDetail(txid) {
    try {
      if (!txid) return { message: 'invalid input' };
      if (!this.httpAgent.getToken()) return { message: 'need login' };

      const res = await this._get(this.apiURL + '/wallet/account/tx/' + txid);
      if (res.success) {
        return res.data;
      }
      return Promise.reject({ message: res.message, code: res.code });
    } catch (error) {
      return Promise.reject({ message: error });
    }
  }

  // 18. List Unspent Transaction Outputs
  /**
   * getUTXO
   * @param {string} accountID 
   * @returns [{
   *   txid: string
   *   vout: number
   *   type: string
   *   amount: string
   *   script: string
   *   timestamp: number
   * }]
   */
  async getUTXO(accountID) {
    try {
      if (!accountID) return { message: 'invalid input' };
      if (!this.httpAgent.getToken()) return { message: 'need login' };

      const res = await this._get(this.apiURL + '/wallet/account/txs/uxto/' + accountID);
      if (res.success) {
        return res.data;
      }
      return Promise.reject({ message: res.message, code: res.code });
    } catch (error) {
      return Promise.reject({ message: error });
    }
  }

  // 19. Get Fee
  /**
   * getFee
   * @param {string} blockchainID 
   * @returns {
   *  slow: string,
   *  standard: string,
   *  fast: string
   * }
   */
  async getFee(blockchainID) {
    try {
      if (!blockchainID) return { message: 'invalid input' };

      const res = await this._get(this.apiURL + '/blockchain/' + blockchainID + '/fee');
      if (res.success) {
        return res.data;
      }
      return Promise.reject({ message: res.message, code: res.code });
    } catch (error) {
      return Promise.reject({ message: error });
    }
  }

  // 20. Get Gas Limit
  /**
   * getGasLimit
   * @param {string} blockchainID 
   * @param {string} fromAddress 
   * @param {string} toAddress 
   * @param {string} value 
   * @param {string} data 
   * @returns {
   *  gasLimit: string
   * }
   */
  async getGasLimit(blockchainID, body) {
    try {
      const { fromAddress, toAddress, value, data } = body;

      if (!blockchainID
        || !fromAddress
        || !toAddress
        || !value
        || !data
        ) return { message: 'invalid input' };

      const res = await this._post(this.apiURL + '/blockchain/' + blockchainID + '/gas-limit', body);
      if (res.success) {
        return res.data;
      }
      return Promise.reject({ message: res.message, code: res.code });
    } catch (error) {
      return Promise.reject({ message: error });
    }
  }

  // 21. Get Nonce
  /**
   * getNonce
   * @param {string} blockchainID 
   * @param {string} address 
   * @returns {
   *  nonce: string
   * }
   */
  async getNonce(blockchainID, address) {
    try {
      if (!blockchainID || !address) return { message: 'invalid input' };
      if (!this.httpAgent.getToken()) return { message: 'need login' };

      const res = await this._get(this.apiURL + '/blockchain/'+ blockchainID + '/address/' + address + '/nonce');
      if (res.success) {
        return res.data;
      }
      return Promise.reject({ message: res.message, code: res.code });
    } catch (error) {
      return Promise.reject({ message: error });
    }
  }

  // 22. Publish Transaction
  /**
   * publishTransaction
   * @param {string} blockchainID 
   * @param {string} accountID 
   * @param {string} hex - transaction hex string
   * @returns {}
   */
  async publishTransaction(blockchainID, body) {
    try {
      const { hex } = body;

      if (!hex) return { message: 'invalid input' };
      if (!this.httpAgent.getToken()) return { message: 'need login' };

      const res = await this._post(this.apiURL + '/blockchain/' + blockchainID + '/push-tx/', body);
      if (res.success) {
        return res.data;
      }
      return Promise.reject({ message: res.message, code: res.code });
    } catch (error) {
      return Promise.reject({ message: error });
    }
  }

  // 23. List Fiat Currency Rate
  /**
   * fiatsRate
   * @returns [{
   *  currency_id: string,
   *  name: string,
   *  rate: string
   * }]
   */
  async fiatsRate() {
    try {
      const res = await this._get(this.apiURL + '/fiats/rate');
      if (res.success) {
        return res.data;
      }
      return Promise.reject({ message: res.message, code: res.code });
    } catch (error) {
      return Promise.reject({ message: error });
    }
  }

  // 24. List Crypto Currency Rate
  /**
   * cryptoRate
   * @returns [{
   *  currency_id: string,
   *  name: string,
   *  rate: string
   * }]
   */
   async cryptoRate() {
    try {
      const res = await this._get(this.apiURL + '/crypto/rate');
      if (res.success) {
        return res.data;
      }
      return Promise.reject({ message: res.message, code: res.code });
    } catch (error) {
      return Promise.reject({ message: error });
    }
  }

  // 25. Get Token Info
  /**
   * tokenInfo
   * @param {string} blockchainID 
   * @param {string} contractAddress 
   * @returns {
   *  symbol: string,
   *  name": string,
   *  contract: string,
   *  decimal: number
   *  total_supply: string,
   *  description: string | null,
   *  imageUrl: string
   * }
   */
  async tokenInfo(blockchainID, contractAddress) {
    try {
      if (!blockchainID || !contractAddress) return { message: 'invalid input' };

      const res = await this._get(this.apiURL + '/blockchain/' + blockchainID + '/contract/' + contractAddress);
      if (res.success) {
        return res.data;
      }
      return Promise.reject({ message: res.message, code: res.code });
    } catch (error) {
      return Promise.reject({ message: error });
    }
  }

  // explorer 5. Call Contract
  /**
   * callContract
   * @param {string} blockchainID 
   * @param {string} contractAddress 
   * @param {Object} body
   * @param {string} body.data - call data hex string
   * @returns {}
   */
   async callContract(blockchainID, contractAddress, body ) {
    try {
      const { data } = body;

      if (!data) return { message: 'invalid input' };

      const res = await this._post(this.apiURL + '/explore/blockchain/' + blockchainID + '/contract/' + contractAddress + '/call', body);
      if (res.success) {
        return res.data;
      }
      return Promise.reject({ message: res.message, code: res.code });
    } catch (error) {
      return Promise.reject({ message: error });
    }
  }

  // system 2. Get Bridge Receive Address
  /**
   * bridgeAccountReceive
   * @param {string} accountID 
   * @returns {
   *  address: string,
   *  keyIndex: number
   * }
   */
  async bridgeAccountReceive(accountID) {
    try {
      if (!accountID) return { message: 'invalid input' };
      if (!this.httpAgent.getToken()) return { message: 'need login' };

      const res = await this._get(this.apiURL + '/system/bridge/address/' + accountID + '/receive');
      if (res.success) {
        return res.data;
      }
      return Promise.reject({ message: res.message, code: res.code });
    } catch (error) {
      return Promise.reject({ message: error });
    }
  }

  // use for need jwt request
  async _get(url) {
    try {
      let res = await this.httpAgent.get(url);
      if (res.code === Code.EXPIRED_ACCESS_TOKEN) {
        await this.accessTokenRenew({ token: this.token, tokenSecret: this.tokenSecret });
        res = await this.httpAgent.get(url);
      }
      return res;
    } catch (e) {
      if (e.code === Code.EXPIRED_ACCESS_TOKEN) {
        try {
          await this.accessTokenRenew({ token: this.token, tokenSecret: this.tokenSecret });
          return this.httpAgent.get(url);
        } catch (error) {
          return Promise.reject(e);
        }
      }
      return Promise.reject(e);
    }
  }

  // use for need jwt request
  async _post(url, body) {
    try {
      let res = await this.httpAgent.post(url, body);
      if (res.code === Code.EXPIRED_ACCESS_TOKEN) {
        await this.accessTokenRenew({ token: this.token, tokenSecret: this.tokenSecret });
        res = await this.httpAgent.post(url, body);
      }
      return res;
    } catch (e) {
      if (e.code === Code.EXPIRED_ACCESS_TOKEN) {
        try {
          await this.accessTokenRenew({ token: this.token, tokenSecret: this.tokenSecret });
          return this.httpAgent.post(url, body);
        } catch (error) {
          return Promise.reject(e);
        }
      }
      return Promise.reject(e);
    }
  }

  // use for need jwt request
  async _delete(url, body) {
    try {
      let res = await this.httpAgent.delete(url, body);
      if (res.code === Code.EXPIRED_ACCESS_TOKEN) {
        await this.accessTokenRenew({ token: this.token, tokenSecret: this.tokenSecret });
        res = await this.httpAgent.delete(url, body);
      }
      return res;
    } catch (e) {
      if (e.code === Code.EXPIRED_ACCESS_TOKEN) {
        try {
          await this.accessTokenRenew({ token: this.token, tokenSecret: this.tokenSecret });
          return this.httpAgent.delete(url, body);
        } catch (error) {
          return Promise.reject(e);
        }
      }
      return Promise.reject(e);
    }
  }

  // use for need jwt request
  async _put(url, body) {
    try {
      let res = await this.httpAgent.put(url, body);
      if (res.code === Code.EXPIRED_ACCESS_TOKEN) {
        await this.accessTokenRenew({ token: this.token, tokenSecret: this.tokenSecret });
        res = await this.httpAgent.put(url, body);
      }
      return res;
    } catch (e) {
      if (e.code === Code.EXPIRED_ACCESS_TOKEN) {
        try {
          await this.accessTokenRenew({ token: this.token, tokenSecret: this.tokenSecret });
          return this.httpAgent.put(url, body);
        } catch (error) {
          return Promise.reject(e);
        }
      }
      return Promise.reject(e);
    }
  }

  _setInfo(token, tokenSecret) {
    this.token = token;
    this.tokenSecret = tokenSecret;
    this.httpAgent.setToken(token);
    try {
      const data = JWT.decode(token);
      const time = (data.exp * 1000) - Date.now() - 5000;
      console.log('renew token timeout', time);
      if (this.tokenRenewTimeout) {
        clearTimeout(this.tokenRenewTimeout);
        this.tokenRenewTimeout = null;
      }
      this.tokenRenewTimeout = setTimeout(async () => {
        await this.accessTokenRenew({ token, tokenSecret });
      }, time);
    } catch (error) {
      this.tokenRenewTimeout = null;
    }
  }
}

module.exports = TideWalletCommunicator;