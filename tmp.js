// const User = require('./src/cores/User');
// const _user = new User()
const Cryptor = require('./src/helpers/Cryptor');
const rlp = require('./src/helpers/rlp');


const userIdentifier = 'test2ejknkjdniednwjq'
const userId = '3fa33d09a46d4e31087a3b24dfe8dfb46750ce534641bd07fed54d2f23e97a0f'
const userSecret = '971db42d2342f5e74a764e57e2d341103565f413a64f242d64b1f7024346a2e1'
const installId = '11f6d3e524f367952cb838bf7ef24e0cfb5865d7b8a8fe5c699f748b2fada249'
const timestamp = 1623129204183

// const userIdentifierBuff = Buffer.from(userIdentifier, 'utf8').toString('hex')
// console.log(Cryptor.keccak256round(userIdentifierBuff || this.thirdPartyId, 1));
// console.log(Cryptor.keccak256round(`0x${userId}` || this.id, 1));
// console.log(
//   Cryptor.keccak256round(
//     rlp.toBuffer(rlp.toBuffer(timestamp).toString('hex').slice(3, 6)).toString('hex'), 1
//   )
// );
const installIdBuff = Buffer.from(installId).toString('hex')
console.log('installIdBuff:', installIdBuff);
console.log(Cryptor.keccak256round(installIdBuff, 1));
