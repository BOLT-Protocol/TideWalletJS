# TideWallet JS

## Browser

1.  Install [browserify](https://browserify.org/)

    ```
    npm install -g browserify
    ```

2.  Build browserify js
    ```
    npm run build
    // browserify -r buffer src/index.js -o dist/bundle.js
    ```

## Node

    const tidewallet = require('./src/index');

### Account {}

- properties
  - messenger<Subject$>
  - accounts
  - currencies

### PaperWallet

- getExtendedPublicKey

  ```
    const seed = Buffer.from(hex_string, 'hex');

    const exPub = tidewallet.PaperWallet.getExtendedPublicKey(seed);
  ```

### DB Operator
- example
    ```
    const dbOperator = new tidewallet.DBOperator();
    dbOperator.init().then((result) => {
      // ...
    }).catch(e => {
      console.log(e);
    })

    dbOperator.userDao.findUser(userId);
    ```

### Helpers

- HTTPAgent

  ```
  const agent = new Agent();

  // Set token to headers
  agent.setToken("token_123");

  agent.get("/blockchain").then((res) => {
      // ...
  });

  ```

## Used Libraries

[web3](https://web3js.readthedocs.io/en/v1.3.4/)

[bitcoinjs-lib](https://github.com/bitcoinjs/bitcoinjs-lib)

[bip39](https://github.com/bitcoinjs/bip39)
