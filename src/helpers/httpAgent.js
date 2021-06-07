const axios = require("axios");
const { url } = require("../constants/config");

let instance
class HTTPAgent {

  constructor() {
    if (!instance) {
      instance = this;
    }

    this.axios = axios.create({
      baseURL: url,
    });

    return instance;
  }

  setInterceptor() {
    // TODO: retry, logger?
  }

  setToken(token) {
    this.axios.defaults.headers.common["token"] = token;
  }

  _request(request) {
    return request().then((res) => {
      if (!res.data) {
        return {
          success: fasle,
        };
      }

      return {
        success: res.data.success,
        data: res.data.payload,
        message: res.data.message,
        code: res.data.code,
      };
    });
  }

  get(path) {
    return this._request(() => this.axios.get(path));
  }

  post() {
    return this._request(() => this.axios.post(path));
  }

  delete() {
    return this._request(() => this.axios.delete(path));
  }

  put() {
    return this._request(() => this.axios.put(path));
  }

  _refreshToken() {
    //TODO:
  }
}

module.exports = HTTPAgent;
