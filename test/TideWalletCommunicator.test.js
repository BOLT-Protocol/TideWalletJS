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
  token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySUQiOiJjMGE2MWU4MS01NmQxLTQ3OTAtODJjMC0zZDhhZWM3OTE3OWEiLCJpYXQiOjE2MjMzMDU1NDcsImV4cCI6MTY1NDg0MTU0N30.Gz4rrf4o63EApIaFybosg5yIKd5sceM6tDZXr3VqSiw",
  tokenSecret: "A0duKpk6vmmVfC4ocwapfIlIf8YADRUu3zcyoxI7FpeIedSYqKG4mfGGNUVk4MQCF2nuKVU9FYJ59cw2lmMEpjat8fISsQGWgaKGta0LsEKIUHYVugelkVvVfHrKjmRYtjLQkdpeNab1rWOtxKDy5TWpat92NC6dhrPcHjFa7CcDHeRObWxo9XXZGnfSU5JgHQSDDvlfiLtCBAI0ZpkYzae5CiqpsHJHZiqROmowdFs3UyqIGX55Sb0w9QnXBB0T",
  userID: "74e341d2-6c14-482a-9272-de4996ede33d"
}

test('regist', async () => {
  expect.assertions(4);
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
  expect.assertions(2);
  const res = await twc.login(testData.token, testData.tokenSecret);
  expect(res.message).not.toBeDefined();
  expect(res.userID).toBe(testData.userID);
})

test('AccessTokenRenew', async () => {
  const res = await twc.AccessTokenRenew({
    token: testData.token,
    tokenSecret: testData.tokenSecret
  });

  expect(res.message).not.toBeDefined();
  expect(res.token).toBeDefined();
  expect(res.tokenSecret).toBeDefined();
  testData.token = res.token;
  testData.tokenSecret = res.tokenSecret;
})

// test.only('TokenInfo', async () => {
//   const res = await twc.TokenInfo('8000003C', '0xc778417e063141139fce010982780140aa0cd5ab');
//   console.log(res);
//   // ++ 補條件
//   // expect(res.userID).toBe(testData.userID);
// })