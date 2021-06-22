const config = require("./constants/config");
const PaperWallet = require("./cores/PaperWallet");
const Account = require("./cores/Account");
const Trader = require("./cores/Trader");
const User = require("./cores/User");
const UI = require("./cores/UI");
const { isBrowser } = require("./helpers/env");
const DBOperator = require("./database/dbOperator");
const TideWalletCommunicator = require("./cores/TideWalletCommunicator");
const TideWalletCore = require("./cores/TideWalletCore");

const tidewallet = {
  PaperWallet,
  Account,
  Trader,
  User,
  UI,
  DBOperator,
  TideWalletCommunicator,
  TideWalletCore,
};

if (isBrowser()) {
  window.Buffer = require("buffer").Buffer;
  window.tidewallet = tidewallet;
}

console.log(isBrowser());

/// TEST AccountCore 
async function main() {
  const db = new tidewallet.DBOperator();
  await db.init();
  const user = new tidewallet.User();

  const userIdentifier = "test2ejknkjdniednwjq";
  const installId =
    "11f6d3e524f367952cb838bf7ef24e0cfb5865d7b8a8fe5c699f748b2fada249";
  const mnemonic =
    "cry hub inmate cliff sun program public else atom absurd release inherit funny edge assault";
  const password = "12345";
  const exist = await user.checkUser();
  if (!exist) {
    const seed = user.mnemonicToSeed(mnemonic, password);
    await user.createUserWithSeed(userIdentifier, seed, installId);
  }

  const AccountCore = new tidewallet.Account();
  AccountCore.setMessenger();
  await AccountCore.init();

  const listener = AccountCore.messenger.subscribe((v) => {
    // console.log('On TideWallet Service Event', v);
  });


}

if (isBrowser()) {
  window.test = main;
}

///

module.exports = tidewallet;
