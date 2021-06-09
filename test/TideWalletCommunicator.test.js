const TideWalletCommunicator = require('../src/cores/TideWalletCommunicator');
const PaperWallet = require('../src/cores/PaperWallet');

const twc = new TideWalletCommunicator({ apiURL: 'https://staging.tidewallet.io/api/v1', apiKey:'123', apiSecret: '123'});
// const twc = new TideWalletCommunicator({ apiURL: 'http://127.0.0.1/api/v1', apiKey:'123', apiSecret: '123'});

const seed = PaperWallet.magicSeed(Math.floor(Math.random() * 1000000).toString());

const testData = {
  wallet_name: 'TideWallet3',
  // ++ 現在regist api有問題，同樣內容跑第二次才會有token回來
  // install_id: Math.floor(Math.random() * 1000000).toString(),
  // app_uuid: Math.floor(Math.random() * 1000000).toString(),
  // extend_public_key: PaperWallet.getExtendedPublicKey(Buffer.from(seed), 'hex'),
  install_id: '837267',
  app_uuid: '114570',
  extend_public_key: 'xpub6DPcAuKdfMTFTiCqcMfYsg69WHjPpAARyDdKb29KgBZ8T2mKFaA9DFazrPYmEQfhP6Y4p98sDG8hre2cdvTvpMmapunQPadxMBv4x1FZcCd',
  token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySUQiOiI3NGUzNDFkMi02YzE0LTQ4MmEtOTI3Mi1kZTQ5OTZlZGUzM2QiLCJpYXQiOjE2MjMyMjk4OTAsImV4cCI6MTY1NDc2NTg5MH0.ihRMgeTF5tBGaEjY4ULu-cWgSFpQWtd97nL80qOIsqs",
  tokenSecret: "GhZcVTo3uPLVdafI9iMJRvwM2gLRcxcxBnRMC0TJ39XyZqBgTCURCvhWuPEEvLnQ2lPv3PA4uTEGVxIVAVQhOXZVl8jRTnKGL62q7XdQFaGfue9CyiSgHJdgQJBRdQAQ4jleN1k3Fh1RFYsjWE6A4wEgAaEQ7cSsSQHk5Edz4nTuTrvN5CiWGwsVAdIWJky595R37Iu5hClpWCGYf2Su1cKDHhmwPnp2uCFPEMjLddbsrSCDUa9cUm48DCpxkdsc",
  userID: "74e341d2-6c14-482a-9272-de4996ede33d"
}

test('regist', async () => {
  const res = await twc.register(testData.install_id, testData.app_uuid, testData.extend_public_key);

  expect(res.message).not.toBeDefined();
  expect(res.token).toBeDefined();
  expect(res.tokenSecret).toBeDefined();
  expect(res.userID).toBeDefined();
  testData.token = res.token;
  testData.tokenSecret = res.tokenSecret;
  testData.userID = res.userID;
})

test('login', async () => {
  expect.assertions(1);
  const res = await twc.login(testData.token, testData.tokenSecret);
  expect(res.userID).toBe(testData.userID);
})

test('BlockchainList', async () => {
  const res = await twc.BlockchainList();
  console.log(res);
  // ++ 補條件
  // expect(res.userID).toBe(testData.userID);
})

test('BlockchainDetail', async () => {
  const res = await twc.BlockchainDetail('80000000');
  console.log(res);
  // ++ 補條件
  // expect(res.userID).toBe(testData.userID);
})

test('CurrencyList', async () => {
  const res = await twc.CurrencyList('80000000');
  console.log(res);
  // ++ 補條件
  // expect(res.userID).toBe(testData.userID);
})