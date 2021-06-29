const HTTPAgent = require('./../helpers/httpAgent');

class TideWalletCommunicator {
  static instance;

  constructor ({ apiURL, apiKey, apiSecret }) {
    if (!TideWalletCommunicator.instance) {
      if (!apiURL) throw new Error('Invalid apiURL');
      if (!apiKey) throw new Error('Invalid apiKey');
      if (!apiSecret) throw new Error('Invalid apiSecret');
      this.apiURL = apiURL;
      this.apiKey = apiKey;
      this.apiSecret = apiSecret;
      this.httpAgent = new HTTPAgent({ apiURL });
  
      this.token;
      this.tokenSecret;
      TideWalletCommunicator.instance = this;
    }
    return TideWalletCommunicator.instance;
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
      const res = await this.httpAgent.post(this.apiURL + '/user/id', body);
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
        this.token = res.data.token;
        this.tokenSecret = res.data.tokenSecret;
        this.httpAgent.setToken(res.data.token);
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
        this.token = token;
        this.tokenSecret = tokenSecret;
        this.httpAgent.setToken(token);
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
   * BlockchainList
   * @returns [{
   *  blockchain_id: string,
   *  name: string,
   *  coin_type: number,
   *  network_id: number,
   *  publish: boolean
   * }]
   */
  async BlockchainList() {
    try {
      const res = await this.httpAgent.get(this.apiURL + '/blockchain');
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
   * BlockchainDetail
   * @param {string} blockchainID 
   * @returns {
   *  blockchain_id: string,
   *  name: string,
   *  coin_type: number,
   *  network_id: number,
   *  publish: boolean
   * }
   */
  async BlockchainDetail(blockchainID) {
    try {
      if (!blockchainID) return { message: 'invalid input' };
      const res = await this.httpAgent.get(this.apiURL + '/blockchain/' + blockchainID);
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
   * CurrencyList
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
  async CurrencyList() {
    try {
      const res = await this.httpAgent.get(this.apiURL + '/currency');
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
   * CurrencyDetail
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
  async CurrencyDetail(currencyID) {
    try {
      if (!currencyID) return { message: 'invalid input' };
      const res = await this.httpAgent.get(this.apiURL + '/currency/' + currencyID);
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
   * TokenList
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
  async TokenList(blockchainID) {
    try {
      const res = await this.httpAgent.get(this.apiURL + '/blockchain/' + blockchainID + '/token');
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
   * TokenDetail
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
  async TokenDetail(blockchainID, currencyID) {
    try {
      const res = await this.httpAgent.get(this.apiURL + '/blockchain/' + blockchainID + '/token/' + currencyID);
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
   * AccessTokenRenew
   * @returns {
   *  token: string,
   *  tokenSecret: string
   * }
   */
  async AccessTokenRenew({ token, tokenSecret }) {
    try {
      const body = {
        token,
        tokenSecret
      }
      const res = await this.httpAgent.post(this.apiURL + '/token/renew', body);
      if (res.success) {
        this.token = res.data.token;
        this.tokenSecret = res.data.tokenSecret;
        this.httpAgent.setToken(this.token);
        return res.data;
      }
      return Promise.reject({ message: res.message, code: res.code });
    } catch (error) {
      return Promise.reject({ message: error });
    }
  }

  // 11. Account Token Regist
  /**
   * TokenRegist
   * @param {string} blockchainID 
   * @param {string} contractAddress 
   * @returns {
   *  token_id: string
   * }
   */
  async TokenRegist(blockchainID, contractAddress) {
    try {
      if (!blockchainID || !contractAddress) return { message: 'invalid input' };
      if (!this.httpAgent.getToken()) return { message: 'need login' };

      const res = await this.httpAgent.post(this.apiURL + '/wallet/blockchain/' + blockchainID + '/contract/' + contractAddress, {});
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
   * AccountList
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
  async AccountList() {
    try {
      if (!this.httpAgent.getToken()) return { message: 'need login' };

      console.log(this.apiURL + '/wallet/accounts');
      const res = await this.httpAgent.get(this.apiURL + '/wallet/accounts');
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
   * AccountDetail
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
  async AccountDetail(accountID) {
    try {
      if (!accountID) return { message: 'invalid input' };
      if (!this.httpAgent.getToken()) return { message: 'need login' };

      const res = await this.httpAgent.get(this.apiURL + '/wallet/account/' + accountID);
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
   * AccountReceive
   * @param {string} accountID 
   * @returns {
   *  address: string,
   *  keyIndex: number
   * }
   */
  async AccountReceive(accountID) {
    try {
      if (!accountID) return { message: 'invalid input' };
      if (!this.httpAgent.getToken()) return { message: 'need login' };

      const res = await this.httpAgent.get(this.apiURL + '/wallet/account/address/' + accountID + '/receive');
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
   * AccountChange
   * @param {string} accountID 
   * @returns {
   *  address: string,
   *  keyIndex: number
   * }
   */
  async AccountChange(accountID) {
    try {
      if (!accountID) return { message: 'invalid input' };
      if (!this.httpAgent.getToken()) return { message: 'need login' };

      const res = await this.httpAgent.get(this.apiURL + '/wallet/account/address/' + accountID + '/change');
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
   * ListTransactions
   * @param {string} accountID 
   * @returns [{
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
  async ListTransactions(accountID) {
    try {
      if (!accountID) return { message: 'invalid input' };
      if (!this.httpAgent.getToken()) return { message: 'need login' };

      const res = await this.httpAgent.get(this.apiURL + '/wallet/account/txs/' + accountID);
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
   * TransactionDetail
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
  async TransactionDetail(txid) {
    try {
      if (!txid) return { message: 'invalid input' };
      if (!this.httpAgent.getToken()) return { message: 'need login' };

      const res = await this.httpAgent.get(this.apiURL + '/wallet/account/tx/' + txid);
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
   * GetUTXO
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
  async GetUTXO(accountID) {
    try {
      if (!accountID) return { message: 'invalid input' };
      if (!this.httpAgent.getToken()) return { message: 'need login' };

      const res = await this.httpAgent.get(this.apiURL + '/wallet/account/txs/uxto/' + accountID);
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
   * GetFee
   * @param {string} blockchainID 
   * @returns {
   *  slow: string,
   *  standard: string,
   *  fast: string
   * }
   */
  async GetFee(blockchainID) {
    try {
      if (!blockchainID) return { message: 'invalid input' };

      const res = await this.httpAgent.get(this.apiURL + '/blockchain/' + blockchainID + '/fee');
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
   * GetGasLimit
   * @param {string} blockchainID 
   * @param {string} fromAddress 
   * @param {string} toAddress 
   * @param {string} value 
   * @param {string} data 
   * @returns {
   *  gasLimit: string
   * }
   */
  async GetGasLimit(blockchainID, body) {
    try {
      const { fromAddress, toAddress, value, data } = body;

      if (!blockchainID
        || !fromAddress
        || !toAddress
        || !value
        || !data
        ) return { message: 'invalid input' };

      const res = await this.httpAgent.post(this.apiURL + '/blockchain/' + blockchainID + '/gas-limit', body);
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
   * GetNonce
   * @param {string} blockchainID 
   * @param {string} address 
   * @returns {
   *  nonce: string
   * }
   */
  async GetNonce(blockchainID, address) {
    try {
      if (!blockchainID || !address) return { message: 'invalid input' };
      if (!this.httpAgent.getToken()) return { message: 'need login' };

      const res = await this.httpAgent.get(this.apiURL + '/blockchain/'+ blockchainID + '/address/' + address + '/nonce');
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
   * PublishTransaction
   * @param {string} blockchainID 
   * @param {string} accountID 
   * @param {string} hex - transaction hex string
   * @returns {}
   */
  async PublishTransaction(blockchainID, body) {
    try {
      const { hex } = body;

      if (!hex) return { message: 'invalid input' };
      if (!this.httpAgent.getToken()) return { message: 'need login' };

      const res = await this.httpAgent.post(this.apiURL + '/blockchain/' + blockchainID + '/push-tx/', body);
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
   * FiatsRate
   * @returns [{
   *  currency_id: string,
   *  name: string,
   *  rate: string
   * }]
   */
  async FiatsRate() {
    try {
      const res = await this.httpAgent.get(this.apiURL + '/fiats/rate');
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
   * CryptoRate
   * @returns [{
   *  currency_id: string,
   *  name: string,
   *  rate: string
   * }]
   */
   async CryptoRate() {
    try {
      const res = await this.httpAgent.get(this.apiURL + '/crypto/rate');
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
   * TokenInfo
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
  async TokenInfo(blockchainID, contractAddress) {
    try {
      if (!blockchainID || !contractAddress) return { message: 'invalid input' };

      const res = await this.httpAgent.get(this.apiURL + '/blockchain/' + blockchainID + '/contract/' + contractAddress);
      if (res.success) {
        return res.data;
      }
      return Promise.reject({ message: res.message, code: res.code });
    } catch (error) {
      return Promise.reject({ message: error });
    }
  }

  
}

module.exports = TideWalletCommunicator;