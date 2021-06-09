const PaperWallet = require("../src/cores/PaperWallet");

describe('keystore', () => {
    const pk = '929cb0a76cccbb93283832c5833d53ce7048c085648eb367a9e63c44c146b35d';
    const pw1 = '123';
    const pw2 = 'asd';
    let keyStore;
    test('createWallet', () => {
        keyStore = PaperWallet.createWallet(pk, pw1);

        expect(keyStore.crypto.ciphertext).toEqual(expect.any(String));
    });

    test('recoverFromJson', () => {
        const jsonKeystore = PaperWallet.walletToJson(keyStore);
        const result = PaperWallet.recoverFromJson(jsonKeystore, pw1);

        expect(result).toBe(pk);
    });

    test('recoverFromJson with wrong password', () => {
        const jsonKeystore = PaperWallet.walletToJson(keyStore);
        const result = PaperWallet.recoverFromJson(jsonKeystore, pw2);

        expect(result).toBe(null);
    });

    test('updatePassword', () => {
        const newKeyStore = PaperWallet.updatePassword(keyStore, pw1, pw2);
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
