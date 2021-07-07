const { Bech32, Bech32Codec } = require('./besh32');
const {
  InvalidHrp,
  InvalidProgramLength,
  InvalidWitnessVersion,
  InvalidPadding,
} = require('./btcExcepition')

/// A codec which converts a Segwit class to its String representation and vice versa.
class SegwitCodec {
  /**
   * @param {Segwit} input 
   */
  static encode(input) {
    const { version, program } = input;

    if (SegwitValidations.isInvalidVersion(version)) {
      throw InvalidWitnessVersion(version);
    }

    if (SegwitValidations.isTooShortProgram(program)) {
      throw InvalidProgramLength("too short");
    }

    if (SegwitValidations.isTooLongProgram(program)) {
      throw InvalidProgramLength("too long");
    }

    if (SegwitValidations.isWrongVersion0Program(version, program)) {
      throw InvalidProgramLength(
        "version $version invalid with length ${program.length}");
    }

    const data = convertBits(program, 8, 5, true);

    return Bech32Codec.encode(Bech32(input.hrp, ([version]).concat(data)));
  }

  /**
   * @param {string} input 
   */
  static decode(input) {
    const decoded = Bech32Codec.decode(input);

    if (SegwitValidations.isInvalidHrp(decoded.hrp)) {
      throw InvalidHrp();
    }

    if (SegwitValidations.isEmptyProgram(decoded.data)) {
      throw InvalidProgramLength("empty");
    }

    const version = decoded.data[0];

    if (SegwitValidations.isInvalidVersion(version)) {
      throw InvalidWitnessVersion(version);
    }

    const program = convertBits(decoded.data.slice(1), 5, 8, false);

    if (SegwitValidations.isTooShortProgram(program)) {
      throw InvalidProgramLength("too short");
    }

    if (SegwitValidations.isTooLongProgram(program)) {
      throw InvalidProgramLength("too long");
    }

    if (SegwitValidations.isWrongVersion0Program(version, program)) {
      throw InvalidProgramLength(
        "version $version invalid with length ${program.length}");
    }

    return new Segwit(decoded.hrp, version, program);
  }
}

/// Generic validations for a Segwit class.
class SegwitValidations {
  static isInvalidHrp(hrp) {
    return hrp != 'bc' && hrp != 'tb' && hrp != 'tltc' && hrp != 'ltc';
  }

  static isEmptyProgram(data) {
    return data.length == 0;
  }

  static isInvalidVersion(version) {
    return version > 16;
  }

  static isWrongVersion0Program(version, program) {
    return version == 0 && (program.length != 20 && program.length != 32);
  }

  static isTooLongProgram(program) {
    return program.length > 40;
  }

  static isTooShortProgram(program) {
    return program.length < 2;
  }
}

/**
 * A representation of a Segwit Bech32 address. This class can be used to obtain the `scriptPubKey`.
 */
class Segwit {
  /**
   * @param {string} hrp 
   * @param {number} version 
   * @param {number[]} program 
   */
  constructor(hrp, version, program) {
    this.hrp = hrp;
    this.version = version;
    this.program = program;
  }

  get scriptPubKey() {
    const v = this.version == 0 ? this.version : this.version + 0x50;
    const arr = [v, this.program.length];
    return arr.concat(this.program)
      .map((c) => c.toString(16).padStart(2, '0'))
      .join('');
  }
}

/**
 * 
 * @param {number[]} data 
 * @param {number} from 
 * @param {number} to 
 * @param {boolean} pad 
 */
function convertBits(data, from, to, pad) {
  let acc = 0;
  let bits = 0;
  const result = [];
  const maxv = (1 << to) - 1;

  for(let v of data) {
    if (v < 0 || (v >> from) != 0) {
      throw Error();
    }
    acc = (acc << from) | v;
    bits += from;
    while (bits >= to) {
      bits -= to;
      result.push((acc >> bits) & maxv);
    }
  }

  if (pad) {
    if (bits > 0) {
      result.push((acc << (to - bits)) & maxv);
    }
  } else if (bits >= from) {
    throw InvalidPadding("illegal zero padding");
  } else if (((acc << (to - bits)) & maxv) != 0) {
    throw InvalidPadding("non zero");
  }

  return result;
}

module.exports = {
  Segwit,
  SegwitCodec,
  convertBits,
}