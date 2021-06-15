const Signer = require('./../src/cores/Signer');
const Cryptor = require('./../src/helpers/Cryptor');

test('sign', () => {
  const rawTransaction = '0xd46e8dd67c5d32be8d46e8dd67c5d32be8058bb8eb970870f072445675058bb8eb970870f072445675';
  const privKey = '929cb0a76cccbb93283832c5833d53ce7048c085648eb367a9e63c44c146b35d';
  // const expR = '2d46c6f11924d035824935697fc64630168ff32b579572862c9cf5b4633d0841';
  const expR = '20479130526553237106528541717068131205762657723827754116476001462341250910273';
  // const expS = '53a90b40f98322c4eca2b3eafb3bde0e87749328cbbc3c13cfa783e7fb29885f';
  const expS = '37840641257281765352258832136473066154395701468149433111297311269542393645151';
  const expV = 28;

  const hashData = Cryptor.keccak256round(rawTransaction, 1);

  const signer = new Signer();
  const signature = signer.sign(Buffer.from(hashData, 'hex'), Buffer.from(privKey, 'hex'));
  const resR = signer._compare(signature.r, expR);
  const resS = signer._compare(signature.s, expS);
  const resV = signer._compare(signature.v, expV);

  expect(resR).toBe(0);
  expect(resS).toBe(0);
  expect(resV).toBe(0);
})