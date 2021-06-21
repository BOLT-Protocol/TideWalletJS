const Signer = require('./../src/cores/Signer');
const Cryptor = require('./../src/helpers/Cryptor');

// mock paperWallet
const paperWallet = {
  getPriKey: (chainIndex, keyIndex, options) => {
    if (chainIndex === 0 && 
    keyIndex === 0 &&
    !options.path
    ) return '3f0e878c684a02c745747211db64ec0c74da71789a6dc6ea19f00d1d58b8effa';

    return null;
  }
};

const signer = new Signer();
signer.init(paperWallet);

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

test('sign', async() => {
  const rawTransaction = '0xd46e8dd67c5d32be8d46e8dd67c5d32be8058bb8eb970870f072445675058bb8eb970870f072445675';
  const expR = 'a60b57ae821d7dfeefdf8d0749152b3b6826315414c6ecddfe7128c888a05dea';
  const expS = '7640d0d2cf73ccd4e030cbac6033ae550ac3ea23dfa89f405d60c3c7a6676875';
  const expV = 27;

  const hashData = Cryptor.keccak256round(rawTransaction, 1);

  const signature = await signer.sign(Buffer.from(hashData, 'hex'), password, 0, 0);
  const resR = signature.r.toString('hex');
  const resS = signature.s.toString('hex');
  const resV = signature.v;

  expect(resR).toBe(expR);
  expect(resS).toBe(expS);
  expect(resV).toBe(expV);
})