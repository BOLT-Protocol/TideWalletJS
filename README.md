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

- Use in UI
```javascript
const ui = new tidewallet.UI();
ui.on('ready', () => { /* do something */ });
ui.on('update', () => { /* do something */ });
ui.on('exception', () => { /* do something */ });

const api = {
  url: 'https://service.tidewallet.io',
  apiKey: 'f2a76e8431b02f263a0e1a0c34a70466',
  apiSecret: '9e37d67450dc906042fde75113ecb78c',
};

// Login with OAuth
const user = {
  OAuthID: 'myAppleID',
  TideWalletID: 'myTideWalletID',
  InstallID: 'myInstallID'
};
ui.init({ user, api });

// Login with Mnemonic
const mnemonic = {
  words: 'pudding cupboard inherit dry rate wet rough venture kitten parrot belt slush',
  passphase: 'asdf1234'
};
ui.init({ mnemonic, api });

let assetList = ui.getAssets();
let assetDetail = ui.getAssetDetail({ assetID });
let transactionDetail = ui.getTransactionDetail({ transactionID });
let address = ui.getReceiveAddress({ accountID });
let fee = ui.getTransactionFee({ blockchainID, from, to, amount, data });
let transaction = ui.prepareTransaction({ to, amount, data, speed }); // --
ui.sendTransaction(transaction); // --
ui.sync(); // --
const paperwallet = ui.backup(); // --
ui.close(); // --
```

- Use TideWallet Core in browser
```javascript
const user = { OAuthID: 'myAppleID', TideWalletID: 'myTideWalletID', InstallID: 'myInstallID' };
const core = new tidewallet.TidewalletCore();

await core.initial(user);

await core.recovery({ thirdPartyIdentity, TideBitIdentity, paperWallet }) // -- not work now

let extpubkey = await core.getExtendedPublicKey();

const keyPath = { chainIndex:0, keyIndex:0 };
const buffer = Buffer.from('8219f1cbbde29ac7e118bdba9a0b48a6e5f37a85ecd06701a1d8bc3f29c8de52', 'hex');

let signBuf = await core.sign({ keyPath, buffer });

let signData = await signData({ keyPath, jsonData }); // -- not work now
let signTx = awaitsignTransaction({ keyPath, coinType, value, data }); // -- not work now
```
