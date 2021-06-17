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
