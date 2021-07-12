class Account {
  constructor({
    id,
    account_id,
    user_id,
    blockchain_id,
    currency_id,
    balance,
    last_sync_time,
    number_of_used_external_key,
number_of_used_internal_key,
    purpose,
    coin_type_account,
    account_index,
    curve_type,
    blockchain,
    coin_type_blockchain,
    publish,
    chain_id,
    name,
    description,
    symbol,
    decimals,
    total_supply,
    contract,
    type,
    image,
    exchange_rate,
  }) {
    this.id = id;
    this.accountId = account_id;
    this.userId = user_id;
    this.blockchainId = blockchain_id;
    this.currencyId = currency_id;
    this.balance = balance;
    this.lastSyncTime = last_sync_time;
    this.numberOfUsedExternalKey=number_of_used_external_key;
    this.numberOfUsedInternalKey=number_of_used_internal_key;
    this.purpose = purpose;
    this.accountCoinType = coin_type_account;
    this.accountIndex = account_index;
    this.curve_type = curve_type;
    this.blockchain = blockchain;
    this.blockchainCoinType = coin_type_blockchain;
    this.publish = publish;
    this.chainId = chain_id;
    this.name = name;
    this.description = description;
    this.symbol = symbol;
    this.decimals = decimals;
    this.totalSupply = total_supply;
    this.contract = contract;
    this.type = type;
    this.image = image;
    this.exchangeRate = exchange_rate;
  }
}
const ACCOUNT_EVT = {
  OnUpdateAccount: "OnUpdateAccount",
  OnUpdateCurrency: "OnUpdateCurrency",
  OnUpdateTransactions: "OnUpdateTransactions",
  OnUpdateTransaction: "OnUpdateTransaction",
  ClearAll: "ClearAll",
  ToggleDisplayCurrency: "ToggleDisplayCurrency",
};

const ACCOUNT = {
  ETH: "ETH",
  BTC: "BTC",
  CFC: "CFC",
};

module.exports = {
  Account,
  ACCOUNT_EVT,
  ACCOUNT,
};
