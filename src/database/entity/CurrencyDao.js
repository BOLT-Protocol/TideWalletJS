module.exports = function({
  currency_id,
  decimals,
  exchange_rate,
  icon,
  name,
  symbol,
  type,
  publish,
  blockchain_id, // ++ for token
  description, // ++ [Did not provided by Backend Service]
  // address,  // ++ [Did not provided by Backend Service]
  total_supply, // ++ [Did not provided by Backend Service]
  contract, // ++ [Did not provided by Backend Service]
}) {
  const _type = type === 0 ? "fiat" : type === 1 ? "currency" : "token";

  return {
    currencyId: currency_id,
    decimals,
    exchangeRate: exchange_rate,
    image: icon,
    name,
    symbol,
    type: _type,
    publish,
    blockchainId: blockchain_id,
    description,
    address: contract,
    totalSupply: total_supply,
    contract,
  };
}