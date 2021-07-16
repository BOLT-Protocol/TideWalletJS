const util = require("../../src/helpers/ethereumUtils");
const ethTxModel = require("../../src/models/transactionETH.model");
const BigNumber = require("bignumber.js");

test("encodeToRlp without message", () => {
  const result =
    "ed04843b9aca00825208943464fb42962bff99da312bd2f5ce9673e51b7d04880de0b6b3a764000080821f518080";

  const tx = ethTxModel.createTransaction({
    nonce: 4,
    to: "0x3464fb42962bff99da312bd2f5ce9673e51b7d04",
    amount: BigNumber(1000000000000000000),
    gasUsed: BigNumber(21000),
    feePerUnit: BigNumber(1000000000),
    chainId: 8017,
  });

  const rlp = util.encodeToRlp(tx);
  expect(rlp.toString("hex")).toBe(result);
});
