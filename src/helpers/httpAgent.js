const axios = require("axios");
const { url } = require("../constants/config");

class HTTPAgent {
  static instance;

  constructor() {
    if (!HTTPAgent.instance) {
      this.axios = axios.create({
        baseURL: url,
      });
      HTTPAgent.instance = this;
    }
    return HTTPAgent.instance;
  }

  setInterceptor() {
    // TODO: retry, logger?
  }

  setToken(token, tokenSecret) {
    this.axios.defaults.headers.common["token"] = token;
    this.token = token
    this.tokenSecret = tokenSecret
  }

  getToken() {
    try {
      const { token } = this.axios.defaults.headers.common
      return token || null
    } catch (e) {
      return null
    }
  }

  _request(request, renewTimes = 5) {
    return request()
      .then((res) => {
        if (!res.data) {
          return {
            success: fasle,
          };
        }

        if (res.data.code === '03000001' && renewTimes > 0) {
          // refresh token
          const body = {
            token: this.token,
            tokenSecret: this.tokenSecret
          }

          return this.post(url+ '/token/renew', body)
            .then((resRenewToken) => {
              if (resRenewToken.success) {
                this.axios.defaults.headers.common["token"] = resRenewToken.data.token;
                this.token = resRenewToken.data.token;
                this.tokenSecret = resRenewToken.data.tokenSecret;
    
                return this._request(request, renewTimes - 1)
              }

              return {
                success: res.data.success,
                data: res.data.payload,
                message: res.data.message,
                code: res.data.code,
              };
            })
        }

        return {
          success: res.data.success,
          data: res.data.payload,
          message: res.data.message,
          code: res.data.code,
        };
      })
  }

  get(path) {
    return this._request(() => this.axios.get(path));
  }

  post(path, body) {
    return this._request(() => this.axios.post(path, body));
  }

  delete(path, body) {
    return this._request(() => this.axios.delete(path, body));
  }

  put(path, body) {
    return this._request(() => this.axios.put(path, body));
  }

  _refreshToken() {
    //TODO:
  }
}

module.exports = HTTPAgent;
