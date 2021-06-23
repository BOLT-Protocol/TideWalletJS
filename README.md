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


### Use TideWallet in Browser
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

- Regist TideWallet
```javascript
const tidewallet = new TideWallet();
tidewallet.on('ready', () => { console.log('TideWallet is Ready'); });
tidewallet.on('update', () => { console.log('TideWallet Data Updated'); });
tidewallet.on('notice', () => { console.log('TideWallet Say Hello'); });
```

- Initial with OAuth
```javascript
const api = {
  apiURL: 'https://service.tidewallet.io/api/v1',
  apiKey: 'f2a76e8431b02f263a0e1a0c34a70466',
  apiSecret: '9e37d67450dc906042fde75113ecb78c',
};

const user = {
  OAuthID: 'myAppleID',
  TideWalletID: 'myTideWalletID',
  InstallID: 'myInstallID'
};
tidewallet.init({ user, api });
```

- Initial with Mnemonic
```javascript
const api = {
  apiURL: 'https://service.tidewallet.io/api/v1',
  apiKey: 'f2a76e8431b02f263a0e1a0c34a70466',
  apiSecret: '9e37d67450dc906042fde75113ecb78c',
};

const user = {
  OAuthID: 'myAppleID',
  TideWalletID: 'myTideWalletID',
  InstallID: 'myInstallID',
  mnemonic: 'pudding cupboard inherit dry rate wet rough venture kitten parrot belt slush',
  passphase: 'asdf1234'
};
tidewallet.init({ mnemonic, api });
```

- Get Asset List
```javascript
let assetList = await tidewallet.getAssets();
```
- Get Asset Detail and Transaction List
```javascript
let assetDetail = await tidewallet.getAssetDetail({ assetID });
```
- Get Transaction Detail
```javascript
let transactionDetail = await tidewallet.getTransactionDetail({ transactionID });
```
- Get Receiving Address
```javascript
let address = await tidewallet.getReceivingAddress({ accountID });
```
- Get Transaction Fee
```javascript
let fee = await tidewallet.getTransactionFee({ blockchainID, from, to, amount, data });
```
- Send a transaction
```javascript
let rawTransaction = await tidewallet.prepareTransaction({ to, amount, data, fee });
let transaction = await tidewallet.sendTransaction(rawTransaction);
```
- Perform a Manual Synchronization
```javascript
tidewallet.sync();
```
- Backup TideWallet
```javascript
let paperWallet = tidewallet.backup();
```
- Close TideWallet
```javascript
tidewallet.close();
```

### Use TideWallet Core in browser
```javascript
const user = { OAuthID: 'myAppleID', TideWalletID: 'myTideWalletID', InstallID: 'myInstallID' };
const core = new TideWallet.core();

await core.initial(user);

await core.recovery({ thirdPartyIdentity, TideBitIdentity, paperWallet }) // -- not work now

let extpubkey = await core.getExtendedPublicKey();

const keyPath = { chainIndex:0, keyIndex:0 };
const buffer = Buffer.from('8219f1cbbde29ac7e118bdba9a0b48a6e5f37a85ecd06701a1d8bc3f29c8de52', 'hex');

let signBuf = await core.sign({ keyPath, buffer });

let signData = await signData({ keyPath, jsonData }); // -- not work now
let signTx = awaitsignTransaction({ keyPath, coinType, value, data }); // -- not work now
```
