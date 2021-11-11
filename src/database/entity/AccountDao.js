module.exports = function({
  id, // account_token_id || account_id
  account_id,
  user_id,
  blockchain_id, // || network_id ++,
  currency_id, // currency_id || token_id
  balance, // Join AccountCurrency
  last_sync_time, // Join AccountCurrency
  number_of_used_external_key,
  number_of_used_internal_key,
  purpose, // Join Account
  coin_type_account, // Join Account
  account_index, // Join Account
  curve_type, // Join Account
  network, // Join Blockchain
  coin_type_blockchain, // Join Blockchain
  publish, // Join Blockchain
  chain_id, // Join Blockchain  || network_id
  name, // Join Currency
  description, // Join Currency
  symbol, // Join Currency
  decimals, // Join Currency
  total_supply, // Join Currency
  contract, // Join Currency
  type, // Join Currency
  image, // Join Currency || url
  exchange_rate, // ++ Join Currency || inUSD,
  inFiat,
}) {
  return {
    id,
    userId: user_id,
    accountId: account_id,
    blockchainId: blockchain_id,
    currencyId: currency_id,
    balance,
    lastSyncTime: last_sync_time,
    numberOfUsedExternalKey: number_of_used_external_key,
    numberOfUsedInternalKey: number_of_used_internal_key,
    purpose,
    accountCoinType: coin_type_account,
    accountIndex: account_index,
    curveType: curve_type,
    network,
    blockchainCoinType: coin_type_blockchain,
    publish,
    chainId: chain_id,
    name,
    description,
    symbol,
    decimals,
    totalSupply: total_supply,
    contract,
    type,
    image,
    exchangeRate: exchange_rate,
    inFiat
    // tokens,
  };
}