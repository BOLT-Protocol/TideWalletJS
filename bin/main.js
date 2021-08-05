const TideWallet = require('../src/index');

async function main() {
  const tw = new TideWallet();
  const api = {
    apiURL: "https://staging.tidewallet.io/api/v1",
    apiKey: "f2a76e8431b02f263a0e1a0c34a70466",
    apiSecret: "9e37d67450dc906042fde75113ecb78c",
  };
  const user1 = {
    thirdPartyId: "test2ejknkjdniednwjq",
    installId:
      "11f6d3e524f367952cb838bf7ef24e0cfb5865d7b8a8fe5c699f748b2fada249",
    mnemonic:
      "cry hub inmate cliff sun program public else atom absurd release inherit funny edge assault",
    password: "12345",
  };
  const user2 = {
    thirdPartyId: "test2ejknkjdniednwjq",
    installId:
      "11f6d3e524f367952cb838bf7ef24e0cfb5865d7b8a8fe5c699f748b2fada249",
  };
  const user = await tw.init({
    user: user2,
    api,
    debugMode: false,
    networkPublish: false,
  });
  //test
  if (user) await tw.createUser({ user });
  console.log("overview:", await tw.overview());
  console.log(
    "getTransactionFee:",
    await tw.getTransactionFee({
      id: "a7255d05-eacf-4278-9139-0cfceb9abed6",
    })
  );
  // console.log('getTransactionDetail:', await tw.getTransactionDetail({ id: "a7255d05-eacf-4278-9139-0cfceb9abed6", transactionId:"" }));
  // console.log('getReceivingAddress:', await tw.getReceivingAddress({ id: "a7255d05-eacf-4278-9139-0cfceb9abed6" }));
  // console.log('getWalletConfig:', await tw.getWalletConfig());
  // await tw.sync();
  await tw.partialSync("cb955812-37df-476a-95a8-d69295b28347");
  // console.log('backup:', await tw.backup());
  // await tw.close();
}

main();