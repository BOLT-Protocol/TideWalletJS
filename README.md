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

```
const tidewallet = require('./src/index');
```

### PaperWallet

- getExtendedPublicKey

  ```
    const seed = Buffer.from(hex_string, 'hex');

    const exPub = tidewallet.PaperWallet.getExtendedPublicKey(seed);
  ```
