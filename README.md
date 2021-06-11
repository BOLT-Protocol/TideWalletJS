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
const UI = new tidewallet.UI();
UI.on('ready', () => { /* do something */ });
UI.on('update', () => { /* do something */ });
UI.on('exception', () => { /* do something */ });

UI.init({ user, api });
let assetList = UI.getAssets();
let assetDetail = UI.getAssetDetail({ assetID });
let transactionDetail = UI.getTransactionDetail({ transactionID });
let address = UI.getReceiveAddress({ accountID });
let fee = UI.getTransactionFee({ blockchainID, from, to, amount, data });
let transaction = UI.prepareTransaction({ to, amount, data, speed }); 
UI.sendTransaction(transaction);
UI.sync(); // --
const paperwallet = UI.backup(); // --
UI.close();
```
