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

## Used Libraries
[web3](https://web3js.readthedocs.io/en/v1.3.4/)

[bitcoinjs-lib](https://github.com/bitcoinjs/bitcoinjs-lib)

[bip39](https://github.com/bitcoinjs/bip39)


### How To Use (DRAFT 2021.06.07)
- Build JS Library
```shell
git clone https://github.com/BOLT-Protocol/TideWalletJS
cd TideWalletJS
sudo npm i -g browserify
npm i
npm run build
```

- Import Library
```html
<script src="./lib/TideWallet.js" type="text/javascript"></script>
```

- Use
```javascript
const user = { OAuthID: 'myAppleID', TideWalletID: 'myTideWalletID', InstallID: 'myInstallID' };
const api = { url: 'https://service.tidewallet.io' };
const tidewallet = new TideWallet();
tidewallet.UI.on('ready', () => { /* do something */ });
tidewallet.UI.on('update', () => { /* do something */ });
tidewallet.UI.on('exception', () => { /* do something */ });

tidewallet.UI.init({ user, api });
let assetList = tidewallet.UI.getAssets();
let assetDetail = tidewallet.UI.getAssetDetail({ assetID });
let transactionDetail = tidewallet.UI.getTransactionDetail({ transactionID });
let address = tidewallet.UI.getReceiveAddress({ coinType });
let fee = tidewallet.UI.getTransactionFee({ to, amount, data });
let transaction = tidewallet.UI.prepareTransaction({ to, amount, data, speed });
tidewallet.UI.sendTransaction(transaction);
tidewallet.UI.sync(); // --
const paperwallet = tidewallet.UI.backup(); // --
tidewallet.close();
```
