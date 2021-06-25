const TideWalletCore = require("../src/cores/TideWalletCore");

describe('construct by user', () => {
    const _TideWalletCore = new TideWalletCore();
    const userIdentifier = 'test2ejknkjdniednwjq'
    const userId = '3fa33d09a46d4e31087a3b24dfe8dfb46750ce534641bd07fed54d2f23e97a0f'
    const userSecret = '971db42d2342f5e74a764e57e2d341103565f413a64f242d64b1f7024346a2e1'
    const installId = '11f6d3e524f367952cb838bf7ef24e0cfb5865d7b8a8fe5c699f748b2fada249'
    const timestamp = 1623129204183
    // const keystore = "";
    // const userInfo = {
    //     id: userId,
    //     thirdPartyId: userIdentifier,
    //     installId,
    //     timestamp,
    //     keystore
    //   }
    // _TideWalletCore.setUserInfo(userInfo);

    test("paperWallet _getNonce ", () => {
        const nonce = _TideWalletCore._getNonce(userIdentifier)
        expect(nonce).toBe(13305180);
    });
    
    test("paperWallet getPassword ", () => {
        const passwd = _TideWalletCore._getPassword({
            userIdentifier, userId, installId, timestamp
        })
        expect(passwd).toBe('72012f0e20235377c36eaee6c1daf6e49e172b63c21091a480c0f44bdfebbe1b');
    });

    test("paperWallet _generateUserSeed", () => {
        const {seed, _extend} = _TideWalletCore._generateUserSeed({ userIdentifier, userId, userSecret });
        
        expect(seed).toBe('e48f77df468d4890f92392568451e7f73e1757c4287c02b04b8b7d9dba063a13');
    })

    test("paperWallet _generateCredentialData ", () => {
        const credential = _TideWalletCore._generateCredentialData({
            userIdentifier, userId, userSecret, installId, timestamp
        })
        expect(credential.key).toBe('b174d55db852ead122fab60519242e9da34106a46c1d36bffd5a741e52cf8f31');
        expect(credential.password).toBe('72012f0e20235377c36eaee6c1daf6e49e172b63c21091a480c0f44bdfebbe1b');
        expect(credential.extend).toBe('8b37c50f');
    });
})

