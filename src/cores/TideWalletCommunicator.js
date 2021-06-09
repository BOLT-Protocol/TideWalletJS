const HTTPAgent = require('./../helpers/httpAgent');

class TideWalletCommunicator {
  constructor ({ apiURL, apiKey, apiSecret }) {
    if (!apiURL) throw new Error('Invalid apiURL');
    if (!apiKey) throw new Error('Invalid apiKey');
    if (!apiSecret) throw new Error('Invalid apiSecret');
    this.apiURL = apiURL;
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    this.httpAgent = new HTTPAgent();

    this.token;
    this.tokenSecret;

    return this;
  }
  
  // 7. User Regist
  async register(installID, appUUID, extendPublicKey) {
    try {
      const body = {
        wallet_name: 'TideWallet3',
        extend_public_key: extendPublicKey,
        install_id: installID,
        app_uuid: appUUID
      }
      const res = await this.httpAgent.post(this.apiURL + '/user', body);
      if (res.success) {
        this.token = res.data.token;
        this.tokenSecret = res.data.tokenSecret;
        return { token: res.data.token, tokenSecret: res.data.tokenSecret, userID: res.data.user_id };
      }
      return { userID: null, message: res.message };
    } catch (error) {
      return { userID: null, message: error };
    }
  }

  // 9. User Token Verify
  async login(token, tokenSecret) {
    try {
      const res = await this.httpAgent.get(this.apiURL + '/token/verify?token=' + this.token);
      if (res.success) {
        this.token = token;
        this.tokenSecret = tokenSecret;
        this.httpAgent.setToken(token);
        return { userID: res.data.user_id };
      }
      return { userID: null, message: res.message };
    } catch (error) {
      return { userID: null, message: error };
    }
  }

  // 1. List Supported Blockchains
  async BlockchainList() {
    try {
      const res = await this.httpAgent.get(this.apiURL + '/blockchain');
      if (res.success) {
        return { BlockchainList: res.data };
      }
      return { BlockchainList: null, message: res.message };
    } catch (error) {
      return { BlockchainList: null, message: error };
    }
  }

  // 2. Get Blockchain Detail
  async BlockchainDetail(blockchainID) {
    try {
      if (!blockchainID) return { BlockchainList: null, message: 'invalid input' };
      const res = await this.httpAgent.get(this.apiURL + '/blockchain/' + blockchainID);
      if (res.success) {
        return { BlockchainDetail: res.data };
      }
      return { BlockchainDetail: null, message: res.message };
    } catch (error) {
      return { BlockchainDetail: null, message: error };
    }
  }

  // 3. List Supported Currencies
  async CurrencyList() {
    try {
      const res = await this.httpAgent.get(this.apiURL + '/currency');
      if (res.success) {
        return { CurrencyList: res.data };
      }
      return { CurrencyList: null, message: res.message };
    } catch (error) {
      return { CurrencyList: null, message: error };
    }
  }
}

module.exports = TideWalletCommunicator;