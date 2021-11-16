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

## Use TideWallet in Node
```javascript
const TideWallet = require('./src/index.js');
const tw = new TideWallet();
tw.on('ready', () => { console.log('TideWallet is Ready'); });
tw.on('notice', () => { console.log('TideWallet Say Hello'); });
tw.on('update', (data) => {
  console.log('TideWallet Data Updated');
  console.log(data);
});


const api = {
  apiURL: 'https://staging.tidewallet.io/api/v1',
  apiKey: 'f2a76e8431b02f263a0e1a0c34a70466',
  apiSecret: '9e37d67450dc906042fde75113ecb78c',
};
const user = {
  thirdPartyId: 'myAppleID',
  installId: 'myInstallID'
};
const debugMode = true;
const networkPublish = false;

tw.init({ user, api, debugMode, networkPublish });
```    

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

const debugMode = true;

const networkPublish = false;

tidewallet.init({ user, api, debugMode, networkPublish });
```

- Initial with Mnemonic
```javascript
const api = {
  apiURL: 'https://service.tidewallet.io/api/v1',
  apiKey: 'f2a76e8431b02f263a0e1a0c34a70466',
  apiSecret: '9e37d67450dc906042fde75113ecb78c',
};

const user = {
  thirdPartyId: 'myAppleID',
  InstallID: 'myInstallID',
  mnemonic: 'pudding cupboard inherit dry rate wet rough venture kitten parrot belt slush',
  passphase: 'asdf1234'
};
tidewallet.init({ mnemonic, api });
```

- Get WalletConfig
```javascript
let walletConfig = tidewallet.getWalletConfig()

// walletConfig = {
//   fiat: {
//     currencyId: "5b1ea92e584bf50020130613",
//     exchangeRate: BigNumber {s: 1, e: 0, c: Array(2)},
//     name: "CNY"
//   },
//   version: "1.0.0",
// }
```

- Get Overview
```javascript
let overview = await tidewallet.overview();

// overview = {
//   balance: "0",
//   currencies: [
//     {
//       accountId: "a7255d05-eacf-4278-9139-0cfceb9abed6",
//       accountType: "CFC",
//       accountcurrencyId: "a7255d05-eacf-4278-9139-0cfceb9abed6",
//       balance: "0",
//       currencyId: "7a55ef8a-a668-11eb-bcbc-0242ac130002",
//       lastSyncTime: 1624951601016,
//       numberOfUsedExternalKey: undefined,
//       numberOfUsedInternalKey: undefined,
//     },
//   ]
// }
```
- Get Asset Detail and Transaction List
```javascript
let assetDetail = await tidewallet.getAssetDetail({ assetID });

// assetDetail = {
//   asset: [
//     {
//       accountId: "a7255d05-eacf-4278-9139-0cfceb9abed6",
//       accountType: "CFC",
//       accountcurrencyId: "a7255d05-eacf-4278-9139-0cfceb9abed6",
//       balance: "0",
//       currencyId: "7a55ef8a-a668-11eb-bcbc-0242ac130002",
//       lastSyncTime: 1624951601016,
//       numberOfUsedExternalKey: undefined,
//       numberOfUsedInternalKey: undefined,
//     },
//   ],
//   transactions: [
//     {
//       accountcurrencyId: "a7255d05-eacf-4278-9139-0cfceb9abed6",
//       amount: "10",
//       confirmation: 764,
//       destinctionAddress: "0x49dcda35c2836296c5bc303525b4800276fdb907",
//       direction: "receive",
//       fee: "0.000021",
//       gasPrice: "0.000000001",
//       gasUsed: undefined,
//       note: "0x",
//       sourceAddress: "0x27642a1f15aa546c97b709a058b4434e93d28a29",
//       status: "success",
//       timestamp: 1624949933,
//       transactionId: "a7255d05-eacf-4278-9139-0cfceb9abed60x52fc770ee037f42a81313fceb2463928a47b9befe936b6596450c2f160e08cd2",
//       txId: "0x52fc770ee037f42a81313fceb2463928a47b9befe936b6596450c2f160e08cd2"
//     },
//   ],
// }
```
- Get Transaction Detail
```javascript
let transactionDetail = await tidewallet.getTransactionDetail({ transactionID });

// transactionDetail = {
//   accountcurrencyId: "a7255d05-eacf-4278-9139-0cfceb9abed6",
//   amount: "10",
//   confirmation: 764,
//   destinctionAddress: "0x49dcda35c2836296c5bc303525b4800276fdb907",
//   direction: "receive",
//   fee: "0.000021",
//   gasPrice: "0.000000001",
//   gasUsed: undefined,
//   note: "0x",
//   sourceAddress: "0x27642a1f15aa546c97b709a058b4434e93d28a29",
//   status: "success",
//   timestamp: 1624949933,
//   transactionId: "a7255d05-eacf-4278-9139-0cfceb9abed60x52fc770ee037f42a81313fceb2463928a47b9befe936b6596450c2f160e08cd2",
//   txId: "0x52fc770ee037f42a81313fceb2463928a47b9befe936b6596450c2f160e08cd2"
// }
```
- Get Receiving Address
```javascript
let address = await tidewallet.getReceivingAddress({ accountID });

// address = ["0x49dcda35c2836296c5bc303525b4800276fdb907", null]
```
- Get Transaction Fee
```javascript
let fee = await tidewallet.getTransactionFee({ accountID, blockchainID, from, to, amount, data });
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

// paperWallet = '{"keyObject":{"metadata":{"nonce":"FgiVWg8jCKsb3Mpz5L3KWeYRK4yhKQgo","iterations":10000},"public":{},"private":"aohJw4fPEXsgWv+TjlweHsRc4p0UHBhJvoTtDQ1uw7oMJTRglT5/7TwOtSisiyLCrHuiEkFuRcrp5O82fo99Ar8Qel0MtkP4hGs52uRfJ1DJjQ=="}}'
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

## Function List
- getVersion
- init
- on
- removeNotifier
- createUser
- resetWallet
- getFiatList
- changeSelectedFiat
- getDebugMode
- overview
- getAssetDetail
- getTransactionDetail
- getReceivingAddress
- verifyAddress
- verifyAmount
- getTransactionFee
- sendTransaction
- sync
- partialSync
- getBridgeAccountReceive
- callContract
- getExchangeRateList
- backup
- close
- notice