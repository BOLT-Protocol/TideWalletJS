const PaperWallet = require("../src/cores/PaperWallet");

describe('keystore', () => {
    const pk = '929cb0a76cccbb93283832c5833d53ce7048c085648eb367a9e63c44c146b35d';
    const pw1 = '123';
    const pw2 = 'asd';
    let keyStore;
    test('createWallet', async () => {
        expect.assertions(1);
        keyStore = await PaperWallet.createWallet(pk, pw1);

        expect(keyStore.keyObject.private).toEqual(expect.any(String));
    });

    test('recoverFromJson', () => {
        const jsonKeystore = PaperWallet.walletToJson(keyStore);
        console.log(jsonKeystore)
        const result = PaperWallet.recoverFromJson(jsonKeystore, pw1);

        expect(result).toBe(pk);
    });

    test('recoverFromJson with wrong password', () => {
        const jsonKeystore = PaperWallet.walletToJson(keyStore);
        const result = PaperWallet.recoverFromJson(jsonKeystore, pw2);

        expect(result).toBe(null);
    });

    test('updatePassword', async () => {
        expect.assertions(2);
        const newKeyStore = await PaperWallet.updatePassword(keyStore, pw1, pw2);
        const jsonKeystore = PaperWallet.walletToJson(newKeyStore);
        const worngPasswordResult = PaperWallet.recoverFromJson(jsonKeystore, pw1);
        const result = PaperWallet.recoverFromJson(jsonKeystore, pw2);

        expect(worngPasswordResult).toBe(null);
        expect(result).toBe(pk);
    });
})

test('seed', () => {
    const privateKey =
          '929cb0a76cccbb93283832c5833d53ce7048c085648eb367a9e63c44c146b35d';
    const expectSeed =
        '35f8af7f1bdb4c53446f43c6f22ba0b525634ab556229fffd0f1813cc75b3a2c';
    const seed = PaperWallet.magicSeed(privateKey);

    expect(seed).toBe(expectSeed);
})

test('getPubKey', () => {
    const seed = Buffer.from('35f8af7f1bdb4c53446f43c6f22ba0b525634ab556229fffd0f1813cc75b3a2c', 'hex');
    const expectPubk = '032166956aca9a1b94db1a9d9bb3a9eb8a146b94856efe11280ba84201d838e546'
    const pubk = PaperWallet.getPubKey(seed, 0, 0);

    expect(pubk).toBe(expectPubk);
})

test('getPubKey uncompressed', () => {
    const seed = Buffer.from('35f8af7f1bdb4c53446f43c6f22ba0b525634ab556229fffd0f1813cc75b3a2c', 'hex');
    const expectPubk = '042166956aca9a1b94db1a9d9bb3a9eb8a146b94856efe11280ba84201d838e546b2b848a7c6b3b461ea6821dd4af1d17f3f0cc36f69081df1f94d62cfa91c18cb'
    const pubk = PaperWallet.getPubKey(seed, 0, 0, { compressed: false });

    expect(pubk).toBe(expectPubk);
})

test('getPriKey', () => {
    const seed = Buffer.from('35f8af7f1bdb4c53446f43c6f22ba0b525634ab556229fffd0f1813cc75b3a2c', 'hex');
    const expectPrik = '24800a8f675f2b9b911e9551bf5bab69b238c531e61c566937cca4c83257730a'
    const pubk = PaperWallet.getPriKey(seed, 0, 0);

    expect(pubk).toBe(expectPrik);
})

test("getExtendedPublicKey", () => {
    const seed = Buffer.from('35f8af7f1bdb4c53446f43c6f22ba0b525634ab556229fffd0f1813cc75b3a2c', 'hex');
    const exPub = PaperWallet.getExtendedPublicKey(seed)

    expect(exPub).toBe('xpub6CFP3LWKoXn9p3YrJ5RygQHKba9p2QJ8dk7uqe3XxhjZrRH9EUnsExXy4EMTPkDrZ77npmeo12negCaXKiWiVro5JUcPYLxHCYBkTQJxiKV');

});

describe('construct by user', () => {
    const _paperWallet = new PaperWallet();
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
    // _paperWallet.init(userInfo);

    test("paperWallet _getNonce ", () => {
        const nonce = _paperWallet._getNonce(userIdentifier)
        expect(nonce).toBe(13305180);
    });
    
    test("paperWallet getPassword ", () => {
        const passwd = _paperWallet.getPassword({
            userIdentifier, userId, installId, timestamp
        })
        expect(passwd).toBe('72012f0e20235377c36eaee6c1daf6e49e172b63c21091a480c0f44bdfebbe1b');
    });

    test("paperWallet _generateUserSeed", () => {
        const {seed, _extend} = _paperWallet._generateUserSeed({ userIdentifier, userId, userSecret });
        
        expect(seed).toBe('e48f77df468d4890f92392568451e7f73e1757c4287c02b04b8b7d9dba063a13');
    })

    test("paperWallet _generateCredentialData ", () => {
        const credential = _paperWallet._generateCredentialData({
            userIdentifier, userId, userSecret, installId, timestamp
        })
        expect(credential.key).toBe('b174d55db852ead122fab60519242e9da34106a46c1d36bffd5a741e52cf8f31');
        expect(credential.password).toBe('72012f0e20235377c36eaee6c1daf6e49e172b63c21091a480c0f44bdfebbe1b');
        expect(credential.extend).toBe('8b37c50f');
    });
})

