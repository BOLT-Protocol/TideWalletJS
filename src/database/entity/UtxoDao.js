module.exports = function ({
  accountId,
  txid,
  vout,
  type,
  amount,
  change_index,
  key_index,
  script,
  timestamp,
  address,
  locked,
}) {
  const DEFAULT_SEQUENCE = 0xffffffff; // temp
    return {
      utxoId: `${txid}-${vout}`,
      accountId,
      txid,
      vout,
      type,
      amount,
      changeIndex: change_index,
      keyIndex: key_index,
      script,
      timestamp,
      locked: locked ?? false,
      address,
      // sequence: BitcoinTransaction.DEFAULT_SEQUENCE,
      sequence: DEFAULT_SEQUENCE, // temp
    };
}