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
      const res = this.httpAgent.post(this.apiURL + `user`, {installID, appUUID, extendPublicKey});

    } catch (error) {
      
    }
    // return { token, tokenSecret, userID };
  }

  // 9. User Token Verify
  async login(token, tokenSecret) {
    try {
      this.token = token;
      this.tokenSecret = tokenSecret;
      this.httpAgent.setToken(token);
      const res = await this.httpAgent.get(this.apiURL + `/token/verify?token=${this.token}`);
      console.log(res)
      if (res.success) {
        return { userID: res.data.user_id }
      }
      return { userID: null, message: 'invalid input' };
    } catch (error) {
      return { userID: null, message: error };
    }
  }

  // 1. List Supported Blockchains

}

module.exports = TideWalletCommunicator;