const TooShortHrp = () => {
  return new Error(`The human readable part should have non zero length.`);
}

const TooLong = (length) => {
  return new Error(`The bech32 string is too long: ${length} (>90)`);
}

const OutOfRangeHrpCharacters = (hrp) => {
  return new Error(`The human readable part contains invalid characters: ${hrp}`);
}

const MixedCase = (hrp) => {
  return new Error(`The human readable part is mixed case, should either be all lower or all upper case: ${hrp}`);
}

const OutOfBoundChars = (char) => {
  return new Error(`A character is undefined in bech32: ${char}`);
}

const InvalidSeparator = (pos) => {
  return new Error(`separator '1' at invalid position: ${pos}`);
}

const InvalidAddress = () => {
  return new Error(``);
}

const InvalidChecksum = () => {
  return new Error(`Checksum verification failed`);
}

const TooShortChecksum = () => {
  return new Error(`Checksum is shorter than 6 characters`);
}

const InvalidHrp = () => {
  return new Error(`Human readable part should be 'bc' or 'tb'.`);
}

const InvalidProgramLength = (reason) => {
  return new Error(`Program length is invalid: ${reason}`);
}

const InvalidWitnessVersion = (version) => {
  return new Error(`Witness version ${version} > 16`);
}

const InvalidPadding = (reason) => {
  return new Error(`Invalid padding: ${reason}`);
}

module.exports = {
  TooShortHrp,
  TooLong,
  OutOfRangeHrpCharacters,
  MixedCase,
  OutOfBoundChars,
  InvalidSeparator,
  InvalidAddress,
  InvalidChecksum,
  TooShortChecksum,
  InvalidHrp,
  InvalidProgramLength,
  InvalidWitnessVersion,
  InvalidPadding,
}