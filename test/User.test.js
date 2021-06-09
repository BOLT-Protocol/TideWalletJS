const rlp = require("../src/helpers/rlp");
const Cryptor = require('../src/helpers/Cryptor');
const User = require("../src/cores/User");
const PaperWallet = require('../src/cores/PaperWallet')


const _user = new User()
const userIdentifier = 'test2ejknkjdniednwjq'
const userId = '3fa33d09a46d4e31087a3b24dfe8dfb46750ce534641bd07fed54d2f23e97a0f'
const userSecret = '971db42d2342f5e74a764e57e2d341103565f413a64f242d64b1f7024346a2e1'
const installId = '11f6d3e524f367952cb838bf7ef24e0cfb5865d7b8a8fe5c699f748b2fada249'
const timestamp = 1623129204183

test("User _getNonce ", () => {
    const nonce = _user._getNonce(userIdentifier)
    expect(nonce).toBe(13305180);
});

test("User getPassword ", () => {
    const passwd = _user.getPassword({
        userIdentifier, userId, installId, timestamp
    })
    expect(passwd).toBe('72012f0e20235377c36eaee6c1daf6e49e172b63c21091a480c0f44bdfebbe1b');
});

test("userid + usernonce -> seed", () => {
    const nonce = _user._getNonce(userIdentifier);

    const userIdentifierBuff = Buffer.from(userIdentifier, 'utf8').toString('hex')
    
    const _main = Buffer.concat([
        Buffer.from(userIdentifierBuff, 'utf8'), 
        rlp.toBuffer(nonce)
    ]).toString().slice(0, 16)

    const _extend = Cryptor.keccak256round(rlp.toBuffer(nonce).toString('hex'), 1).slice(0, 8);

    const seed = Cryptor.keccak256round(
        Buffer.concat([
            Buffer.from(Cryptor.keccak256round(
                Buffer.concat([
                    Buffer.from(Cryptor.keccak256round(_main, 1)),
                    Buffer.from(Cryptor.keccak256round(_extend, 1))
                ]).toString()
            )),
            Buffer.from(Cryptor.keccak256round(
                Buffer.concat([
                    Buffer.from(Cryptor.keccak256round(userId, 1)),
                    Buffer.from(Cryptor.keccak256round(userSecret, 1))
                ]).toString()
            ))
        ]).toString()
    );
    expect(seed).toBe('e48f77df468d4890f92392568451e7f73e1757c4287c02b04b8b7d9dba063a13');
})

test("User _generateCredentialData ", () => {
    const credential = _user._generateCredentialData({
        userIdentifier, userId, userSecret, installId, timestamp
    })
    expect(credential.key).toBe('b174d55db852ead122fab60519242e9da34106a46c1d36bffd5a741e52cf8f31');
    expect(credential.password).toBe('72012f0e20235377c36eaee6c1daf6e49e172b63c21091a480c0f44bdfebbe1b');
    expect(credential.extend).toBe('8b37c50f');
});





test("User restorePaperWallet ", () => {
    const keystore = PaperWallet.createWallet()
    const result = _user.restorePaperWallet();
    expect(result).toBeTruthy();
});



test("User backupWallet ", () => {
    const result = _user.backupWallet();
    expect(result).toBeTruthy();
});
