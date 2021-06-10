const rlp = require('./../../src/helpers/rlp');

test("rlp convers string", () => {
  const buf = rlp.toBuffer('test')
  expect(buf).toBeInstanceOf(Buffer)
  expect(buf.toString('hex')).toBe('74657374');
});


test("rlp convers int", () => {
  const buf = rlp.toBuffer(1623129204183)
  expect(buf).toBeInstanceOf(Buffer)
  expect(buf.toString('hex')).toBe('0179ea0a25d7');
});