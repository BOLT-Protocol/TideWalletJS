const Signer = require('./../src/cores/Signer');
const Cryptor = require('./../src/helpers/Cryptor');

const seed = Buffer.from('35f8af7f1bdb4c53446f43c6f22ba0b525634ab556229fffd0f1813cc75b3a2c');
const signer = new Signer(seed, 0, 0);

test('_sign', () => {
  const rawTransaction = '0xd46e8dd67c5d32be8d46e8dd67c5d32be8058bb8eb970870f072445675058bb8eb970870f072445675';
  const privKey = '929cb0a76cccbb93283832c5833d53ce7048c085648eb367a9e63c44c146b35d';
  const expR = '2d46c6f11924d035824935697fc64630168ff32b579572862c9cf5b4633d0841';
  // == 20479130526553237106528541717068131205762657723827754116476001462341250910273
  const expS = '53a90b40f98322c4eca2b3eafb3bde0e87749328cbbc3c13cfa783e7fb29885f';
  // == 37840641257281765352258832136473066154395701468149433111297311269542393645151
  const expV = 28;

  const hashData = Cryptor.keccak256round(rawTransaction, 1);

  const signature = signer._sign(Buffer.from(hashData, 'hex'), Buffer.from(privKey, 'hex'));
  const resR = signature.r.toString('hex');
  const resS = signature.s.toString('hex');
  const resV = signature.v;

  expect(resR).toBe(expR);
  expect(resS).toBe(expS);
  expect(resV).toBe(expV);
})

test('sign', () => {
  const rawTransaction = '0xd46e8dd67c5d32be8d46e8dd67c5d32be8058bb8eb970870f072445675058bb8eb970870f072445675';
  const expR = 'ba18b68bc6a42f9f2fb4774b8dc7766582662566a74f75d70d1438860f03b04f';
  const expS = '47c782a1c7f51cf78881b1189ce4bcc30a895eb6ffe7b63d66186d36db7407e8';
  const expV = 28;

  const hashData = Cryptor.keccak256round(rawTransaction, 1);

  const signature = signer.sign(Buffer.from(hashData, 'hex'));
  const resR = signature.r.toString('hex');
  const resS = signature.s.toString('hex');
  const resV = signature.v;

  expect(resR).toBe(expR);
  expect(resS).toBe(expS);
  expect(resV).toBe(expV);
})