const { default: BigNumber } = require("bignumber.js");
const rlp = require("rlp");
const Cryptor = require("./Cryptor");

/**
 * Checks if the given string is an address
 *
 * @method isAddress
 * @param {String} address the given HEX adress
 * @return {Boolean}
 */
var isAddress = function (address) {
  if (!/^(0x)?[0-9a-f]{40}$/i.test(address)) {
    // check if it has the basic requirements of an address
    return false;
  } else if (
    /^(0x)?[0-9a-f]{40}$/.test(address) ||
    /^(0x)?[0-9A-F]{40}$/.test(address)
  ) {
    // If it's all small caps or all all caps, return true
    return true;
  } else {
    // Otherwise check each case
    return isChecksumAddress(address);
  }
};

/**
 * Checks if the given string is a checksummed address
 *
 * @method isChecksumAddress
 * @param {String} address the given HEX adress
 * @return {Boolean}
 */
var isChecksumAddress = function (address) {
  // Check each case
  address = address.replace("0x", "");
  // ++ TODO  # Treat the hex address as ascii/utf-8 for keccak256 hashing
  var addressHash = Cryptor.keccak256round(address.toLowerCase(), 1);
  for (var i = 0; i < 40; i++) {
    // the nth letter should be uppercase if the nth digit of casemap is 1
    if (
      (parseInt(addressHash[i], 16) > 7 &&
        address[i].toUpperCase() !== address[i]) ||
      (parseInt(addressHash[i], 16) <= 7 &&
        address[i].toLowerCase() !== address[i])
    ) {
      return false;
    }
  }
  return true;
};

function verifyEthereumAddress(address) {
  if (address.includes(":")) {
    address = address.split(":")[1];
  }

  return isAddress(address);
}

/**
 * RLP encode ETH Transation
 * @method encodeToRlp
 * @param {ETHTransaction} transaction The ETHTransaction
 * @returns {Buffer} rlp
 */
function encodeToRlp(transaction) {
  console.log(transaction);
  const list = [
    Buffer.from(transaction.nonce.toString(16)),
    transaction.gasPrice.toString(16),
    transaction.gasUsed.toString(16),
  ].map((v) => `0x${v}`);
  console.log(list);

  if (transaction.destinationAddresses) {
    list.push(transaction.destinationAddresses);
  } else {
    list.push("");
  }
  console.log(list);

  list.push(`0x${transaction.amount.toString(16)}`);
  console.log(list);

  if (transaction.message) {
    list.push(transaction.message);
  } else {
    list.push("");
  }
  console.log(list);

  if (transaction.signature) {
    list.push(transaction.signature.v);
    if (BigNumber.isBigNumber(transaction.signature.r))
      list.push(transaction.signature.r.toNumber());
    else list.push(transaction.signature.r);
    if (BigNumber.isBigNumber(transaction.signature.s))
      list.push(transaction.signature.s.toNumber());
    else list.push(transaction.signature.s);
  }
  console.log(list);
  console.log("rlp", rlp.encode(list));

  return rlp.encode(list);
}

function getEthereumAddressBytes(address) {
  return Buffer.from(address, "hex");
}

module.exports = {
  encodeToRlp,
  verifyEthereumAddress,
  getEthereumAddressBytes,
};
