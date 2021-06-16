function verifyEthereumAddress() {
  // if (address.contains(':')) {
  //     address = address.split(':')[1];
  //   }
  //   if (!isValidFormat(address)) {
  //     return false;
  //   }
  //   address = stripHexPrefix(address);
  //   // if all lowercase or all uppercase, as in checksum is not present
  //   if (RegExp(r"^[0-9a-f]{40}$").hasMatch(address) ||
  //       RegExp(r"^[0-9A-F]{40}$").hasMatch(address)) {
  //     return true;
  //   }
  //   String checksumAddress;
  //   try {
  //     checksumAddress = eip55Address(address);
  //   } catch (err) {
  //     return false;
  //   }
  //   return address == checksumAddress.substring(2);
}

function encodeToRlp(transaction) {
  // const list = [
  //   transaction.nonce,
  //   BigInt.parse(transaction.gasPrice.toString()),
  //   transaction.gasUsed.toInt(),
  // ];
  // if (transaction.to != null) {
  //   list.add(getEthereumAddressBytes(transaction.to));
  // } else {
  //   list.add('');
  // }
  // list
  //   ..add(BigInt.parse(transaction.amount.toString()))
  //   ..add(transaction.message);
  // if (transaction.signature != null) {
  //   list
  //     ..add(transaction.signature.v)
  //     ..add(transaction.signature.r)
  //     ..add(transaction.signature.s);
  // }
  // Log.debug('ETH list: $list');
  // return rlp.encode(list);
}

function getEthereumAddressBytes(address) {
  // if (!isValidFormat(address)) {
  //   throw ArgumentError.value(address, "address", "invalid address");
  // }
  // final String addr = stripHexPrefix(address).toLowerCase();
  // Uint8List buffer = Uint8List.fromList(hex.decode(addr));
  // return buffer;
}

module.exports = {
  encodeToRlp,
  verifyEthereumAddress,
  getEthereumAddressBytes
};
