module.exports = function({
  currency_id,
  name,
  rate,
  timestamp,
  type
}) {
  return {
    exchangeRateId: currency_id,
    name,
    rate,
    lastSyncTime: timestamp,
    type,
  };
}