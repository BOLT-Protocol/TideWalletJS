const {
  TooLong,
  MixedCase,
  InvalidSeparator,
  TooShortChecksum,
  TooShortHrp,
  OutOfRangeHrpCharacters,
  OutOfBoundChars,
  InvalidChecksum,

} = require('./btcExcepition')

class Bech32Codec {
  /**
   * @param {string} input 
   * @param {number} maxLength 
   */
  static decode(input, maxLength = Bech32Validations.maxInputLength) {
    if (input.length > maxLength) {
      throw TooLong(input.length);
    }

    if (Bech32Validations.isMixedCase(input)) {
      throw MixedCase(input);
    }

    if (Bech32Validations.hasInvalidSeparator(input)) {
      throw InvalidSeparator(input.lastIndexOf(separator));
    }

    const separatorPosition = input.lastIndexOf(separator);

    if (Bech32Validations.isChecksumTooShort(separatorPosition, input)) {
      throw TooShortChecksum();
    }

    if (Bech32Validations.isHrpTooShort(separatorPosition)) {
      throw TooShortHrp();
    }

    input = input.toLowerCase();

    const hrp = input.substring(0, separatorPosition);
    const data = input.substring(
      separatorPosition + 1, input.length - Bech32Validations.checksumLength);
    const checksum =
      input.substring(input.length - Bech32Validations.checksumLength);

    if (Bech32Validations.hasOutOfRangeHrpCharacters(hrp)) {
      throw OutOfRangeHrpCharacters(hrp);
    }

    const dataBytes = data.split('').map((c) => {
      return charset.indexOf(c);
    });

    if (Bech32Validations.hasOutOfBoundsChars(dataBytes)) {
      throw OutOfBoundChars(data[dataBytes.indexOf(-1)]);
    }

    const checksumBytes = checksum.split('').map((c) => {
      return charset.indexOf(c);
    });

    if (Bech32Validations.hasOutOfBoundsChars(checksumBytes)) {
      throw OutOfBoundChars(checksum[checksumBytes.indexOf(-1)]);
    }

    if (Bech32Validations.isInvalidChecksum(hrp, dataBytes, checksumBytes)) {
      throw InvalidChecksum();
    }

    return new Bech32(hrp, dataBytes);
  };

  /**
   * @param {Bech32} input 
   * @param {number} maxLength 
   */
  static encode(input, maxLength = Bech32Validations.maxInputLength) {
    const { hrp, data } = input;

    if (hrp.length +
      data.length +
      separator.length +
      Bech32Validations.checksumLength >
      maxLength) {
      throw TooLong(
        hrp.length + data.length + 1 + Bech32Validations.checksumLength);
    }

    if (hrp.length < 1) {
      throw TooShortHrp();
    }

    if (Bech32Validations.hasOutOfRangeHrpCharacters(hrp)) {
      throw OutOfRangeHrpCharacters(hrp);
    }

    if (Bech32Validations.isMixedCase(hrp)) {
      throw MixedCase(hrp);
    }

    hrp = hrp.toLowerCase();

    const checksummed = data.concat(_createChecksum(hrp, data));

    if (Bech32Validations.hasOutOfBoundsChars(checksummed)) {
      // TODO this could be more informative
      throw OutOfBoundChars('<unknown>');
    }

    return hrp + separator + checksummed.map((i) => charset[i]).join('');
  }
}

/// Generic validations for Bech32 standard.
class Bech32Validations {
  static get maxInputLength() { return 90 };
  static get checksumLength() { return 6 };

  /**
   * From the entire input subtract the hrp length, the separator and the required checksum length
   * @param {number} separatorPosition 
   * @param {string} input 
   */
  static isChecksumTooShort(separatorPosition, input) {
    return (input.length - separatorPosition - 1 - Bech32Validations.checksumLength) < 0;
  }

  /**
   * @param {number[]} data 
   */
  static hasOutOfBoundsChars(data) {
    return data.includes(-1);
  }

  /**
   * @param {number} separatorPosition 
   */
  static isHrpTooShort(separatorPosition) {
    return separatorPosition === 0;
  }

  /**
   * @param {string} hrp 
   * @param {number[]} data 
   * @param {number[]} checksum 
   */
  static isInvalidChecksum(hrp, data, checksum) {
    return !_verifyChecksum(hrp, data.concat(checksum));
  }

  /**
   * @param {string} input 
   */
  static isMixedCase(input) {
    return input.toLowerCase() != input && input.toUpperCase() != input;
  }

  /**
   * @param {String} bech32 
   */
  static hasInvalidSeparator(bech32) {
    return bech32.lastIndexOf(separator) == -1;
  }

  /**
   * @param {string} hrp 
   */
  static hasOutOfRangeHrpCharacters(hrp) {
    const buf = Buffer.from(hrp);
    const arr = [...buf];
    return arr.some((c) => c < 33 || c > 126);
  }
}

/// Bech32 is a dead simple wrapper around a Human Readable Part (HRP) and a
/// bunch of bytes.
class Bech32 {
  /**
   * @param {string} hrp 
   * @param {number[]} data 
   */
  constructor(hrp, data) {
    this._hrp = hrp;
    this._data = data;
  }

  get hrp() {
    return this._hrp;
  }

  get data() {
    return this._data;
  }
}

const separator = '1';

const charset = [
  'q',
  'p',
  'z',
  'r',
  'y',
  '9',
  'x',
  '8',
  'g',
  'f',
  '2',
  't',
  'v',
  'd',
  'w',
  '0',
  's',
  '3',
  'j',
  'n',
  '5',
  '4',
  'k',
  'h',
  'c',
  'e',
  '6',
  'm',
  'u',
  'a',
  '7',
  'l',
];

const generator = [
  0x3b6a57b2,
  0x26508e6d,
  0x1ea119fa,
  0x3d4233dd,
  0x2a1462b3,
];

/**
 * @param {number[]} values 
 */
function _polymod(values) {
  let chk = 1;
  values.map((v) => {
    const top = chk >> 25
    chk = (chk & 0x1ffffff) << 5 ^ v;
    for (let i = 0; i < generator.length; i++) {
      if ((top >> i) & 1 === 1) {
        chk ^= generator[i];
      }
    }
  });
  return chk;
}

/**
 * @param {string} hrp 
 * @return number[]
 */
function _hrpExpand(hrp) {
  const buf = Buffer.from(hrp);
  const arr = [...buf];
  let result = arr.map((c) => c >> 5);
  result.push(0);
  result = result.concat(arr.map((c) => c & 31));

  return result;
}

/**
 * @param {string} hrp 
 * @param {number[]} dataIncludingChecksum 
 */
function _verifyChecksum(hrp, dataIncludingChecksum) {
  return _polymod(_hrpExpand(hrp).concat(dataIncludingChecksum)) == 1;
}

/**
 * @param {string} hrp 
 * @param {number[]} data 
 */
function _createChecksum(hrp, data) {
  const values = _hrpExpand(hrp).concat(data.concat([0, 0, 0, 0, 0, 0]));
  const polymod = _polymod(values) ^ 1;

  let result = [];

  for (let i = 0; i < 6; i++) {
    result.push((polymod >> (5 * (5 - i))) & 31);
  }
  return result;
}

module.exports = {
  Bech32Codec,
  Bech32
}