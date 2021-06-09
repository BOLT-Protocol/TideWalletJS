const TideWalletCommunicator = require('../src/cores/TideWalletCommunicator');

const twc = new TideWalletCommunicator({ apiURL: 'http://127.0.0.1/api/v1', apiKey:'123', apiSecret: '123'});

const testData = {
  token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySUQiOiJkNGRiMWVlZS00MjczLTQ5OWMtOTk3NC0zNmRmY2ZkZjdmM2IiLCJpYXQiOjE2MjMyMjE5OTEsImV4cCI6MTY1NDc1Nzk5MX0.DhydWDqJA92Qg3ceoo1XLebGHxqTcygiwnfPI0Jxz1o",
  tokenSecret: "9noXVatTDbimW7g156gx0x9Ba1xtxnA5k4wi1wIM8FZs05ZD10WXTegUQ5fAP0elGyHxzea1n7kuXylUw50RjKyT78SGz5OZnktzJ3AE2YmT7Xkxo8MWR1EM0BCSIX9hHY9cAgvTOa7LLYAy8DyISx8lGB7JwZZWPb2PafsFVgzGjN0LHqKtUdWCkAwVfBuxnw0c78bKqynSEE4FjQBPkp0fmVGhw4J37r8ngrOV7UWV1mTygzjNl4FkN9m0e6aw",
  user_id: "d4db1eee-4273-499c-9974-36dfcfdf7f3b"
}

test.only('login', async () => {
  expect.assertions(1);
  const res = await twc.login(testData.token, testData.tokenSecret);
  console.log(res)
  expect(res.userID).toBe(testData.user_id);
})