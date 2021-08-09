const TideWalletCore = require("../src/cores/TideWalletCore");
const Cryptor = require('./../src/helpers/Cryptor');

describe('construct by user', () => {
    const _TideWalletCore = new TideWalletCore();
    const userIdentifier = "test2ejknkjdniednwjq"
    const userId = "4f4c4d46662e1f642f0512b9"
    const userSecret = '971db42d2342f5e74a764e57e2d341103565f413a64f242d64b1f7024346a2e1'
    const installId = "11f6d3e524f367952cb838bf7ef24e0cfb5865d7b8a8fe5c699f748b2fada249"
    const timestamp = 1624586411
    const keystore = '{"keyObject":{"metadata":{"nonce":"pHrVE5G/DnT3J30WwteLpDj4QgaB7P1L","iterations":10000},"public":{},"private":"F9pTGpDSDZ9GjdcgandItm5qnwiKCQv5USb7JxUd8jrdYoQtjmw7pBVcjWx44VdTV9isKcUGH/Lgpe2xNobxFvVHmizZnIb5mHm8thZwvXV6uQ=="}}';
    const userInfo = {
        id: userId,
        thirdPartyId: userIdentifier,
        installId,
        timestamp,
        keystore
      }
    _TideWalletCore.setUserInfo(userInfo);

    test("TideWalletCore _getNonce ", () => {
        const nonce = _TideWalletCore._getNonce(userIdentifier)
        expect(nonce).toBe('cb055c');
    });
    
    test("TideWalletCore getPassword ", () => {
        const passwd = _TideWalletCore._getPassword({
            userIdentifier, userId, installId, timestamp
        })
        expect(passwd).toBe('c6a0d1a9eadafbc8e9fbb181dc6cb0a7122a5f59005598e96339765d89d5aced');
    });

    test("TideWalletCore _generateUserSeed", () => {
        const {seed, _extend} = _TideWalletCore._generateUserSeed({ userIdentifier, userId, userSecret });
        
        expect(seed).toBe('01ff606c326e262242652a579436aa0833359144e475ec713cbc5f956faa755c');
    })

    test("TideWalletCore _generateCredentialData ", () => {
        const credential = _TideWalletCore._generateCredentialData({
            userIdentifier, userId, userSecret, installId, timestamp
        })
        expect(credential.key).toBe('bcb308803f3de97747b1952a3a65b15098a2b045ddd383c6c2ed26996bc5b25d');
        expect(credential.password).toBe('c6a0d1a9eadafbc8e9fbb181dc6cb0a7122a5f59005598e96339765d89d5aced');
        expect(credential.extend).toBe('8b37c50f');
    });

    test("TideWalletCore signBuffer", async() => {
        const rawTransaction = '0xd46e8dd67c5d32be8d46e8dd67c5d32be8058bb8eb970870f072445675058bb8eb970870f072445675';
        const expR = 'cc02f28c1b1dd4dbf12ff980cef551c64bb6ea3a880d85d5d663588b9f4d66b4';
        const expS = '61425deaea69c273f9aad66d277530fef699ba5459360047e85f9f441dfe755f';
        const expV = 28;

        const hashData = Cryptor.keccak256round(rawTransaction, 1);
        const data = Buffer.from(hashData, 'hex');
        const keyPath = "m/84'/3324'/0'/0/0";

        const signature = await _TideWalletCore.signBuffer({ keyPath, data });
        const resR = signature.r.toString('hex');
        const resS = signature.s.toString('hex');
        const resV = signature.v;

        expect(resR).toBe(expR);
        expect(resS).toBe(expS);
        expect(resV).toBe(expV);
    })
})

