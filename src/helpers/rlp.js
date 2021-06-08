class rlp {
  static isHexString(value) {
    if (!value) return false;
  
    return /^0x[0-9A-Fa-f]*/.test(value)
  }
  static intToHex(int) {
    if (int < 0) {
      throw new Error('Invalid integer as argument, must be unsigned!')
    }
    const hex = int.toString(16)
    return hex.length % 2 ? `0${hex}` : hex
  }
  static intToBuffer(int) {
    const hex = rlp.intToHex(int)
    return Buffer.from(hex, 'hex')
  }
  static intToBuffer(int) {
    const hex = rlp.intToHex(int)
    return Buffer.from(hex, 'hex')
  }
  static toBuffer(data) {
    if (data === null) return Buffer.from(0)
    if (Buffer.isBuffer(data)) return data

    if (typeof data === 'string') {
      if (rlp.isHexString(data)) {
        return Buffer.from(data, 'hex')
      } else {
        return Buffer.from(data, 'utf8')
      }
    } else if (typeof data === 'number') {
      if (data === 0) return Buffer.from(0)
      return rlp.intToBuffer(data)
    // } else if (data is BigInt) {
    //   if (data == BigInt.zero) return Uint8List(0);
    //   return Uint8List.fromList(encodeBigInt(data));
    } else if (Array.isArray(data)) {
      return Buffer.from(data)
    }
  }
}

module.exports = rlp 
