module.exports = function({
  blockchain_id,
  network,
  coin_type,
  publish,
  chain_id
}) {
  return {
    blockchainId: blockchain_id,
    network,
    coinType: coin_type,
    publish,
    chainId: chain_id,
  };
}