class HTTPAgent {
  static instance;

  constructor() {
    if (!HTTPAgent.instance) {
      HTTPAgent.instance = this;
    }

    return HTTPAgent.instance;
  }

  setInterceptor() {}

  setToken() {}

  get() {}

  post() {}

  delete() {}

  put() {}

  _request() {}

  _refreshToken() {}
}
