class rlp {
  static isHexString(value) {
    if (!value) return false;
  
    return /^0x[0-9A-Fa-f]*/.test(value)
  }
  static toBuffer(data) {
    if (data === null) return Buffer.from()
    if (Buffer.isBuffer(data)) return data

    if (typeof data === 'string') {
      if (this.isHexString(data)) {
        return Buffer.from(data, 'hex')
      } else {
        return Buffer.from(data, 'utf8')
      }
    } else if (typeof data === 'number') {
      if (data === 0) return Buffer.from(0)
      let buf = Buffer.allocUnsafe(`${data}`.length);
      return buf.writeInt32LE(data); 
    // } else if (data is BigInt) {
    //   if (data == BigInt.zero) return Uint8List(0);
    //   return Uint8List.fromList(encodeBigInt(data));
    } else if (Array.isArray(data)) {
      return Buffer.from(data)
    }
  }
}

module.exports = rlp 
