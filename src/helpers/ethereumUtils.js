const rlp = require("rlp");
const Cryptor = require("./Cryptor");
const createKeccakHash = require('keccak')

function toChecksumAddress (address) {
  // ++ 兩個keccak256不一樣 Cryptor.keccak256round 同 TideBitWallet[Flutter] 
  // var addressHash = Cryptor.keccak256round(address, 1);
  // console.log(addressHash)
  address = address.toLowerCase().replace('0x', '')
  var hash = createKeccakHash('keccak256').update(address).digest('hex')
  var ret = '0x'
  // console.log(hash)

  for (var i = 0; i < address.length; i++) {
    if (parseInt(hash[i], 16) >= 8) {
      ret += address[i].toUpperCase()
    } else {
      ret += address[i]
    }
  }

  return ret
}

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
const isChecksumAddress = function (address) {
  // Check each case
  const checksumAddress = toChecksumAddress(address);
  return address === checksumAddress;
};

function verifyEthereumAddress(address) {
  isChecksumAddress(address);
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
  console.log("encodeToRlp",transaction);

  const list = [
    transaction.nonce,
    parseInt(transaction.feePerUnit),
    parseInt(transaction.gasUsed),
  ];

  if (transaction.destinationAddresses) {
    list.push(transaction.destinationAddresses);
  } else {
    list.push("");
  }

  list.push(parseInt(transaction.amount));

  if (transaction.message) {
    list.push(transaction.message);
  } else {
    list.push("");
  }

  if (transaction.signature) {
    list.push(transaction.signature.v);
    list.push(transaction.signature.r);
    list.push(transaction.signature.s);
  }
  console.log(list);

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
