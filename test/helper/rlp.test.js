const { toBuffer } = require('../../src/helpers/utils');

test("rlp convers string", () => {
  const buf = toBuffer('test')
  expect(buf).toBeInstanceOf(Buffer)
  expect(buf.toString('hex')).toBe('74657374');
});


test("rlp convers int", () => {
  const buf = toBuffer(1623129204183)
  expect(buf).toBeInstanceOf(Buffer)
  expect(buf.toString('hex')).toBe('0179ea0a25d7');
});