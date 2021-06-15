const rlp = require("../src/helpers/rlp");
const Cryptor = require('../src/helpers/Cryptor');
const User = require("../src/cores/User");
const PaperWallet = require('../src/cores/PaperWallet');

const _user = new User()
const userIdentifier = 'test2ejknkjdniednwjq'
const userId = '3fa33d09a46d4e31087a3b24dfe8dfb46750ce534641bd07fed54d2f23e97a0f'
const userSecret = '971db42d2342f5e74a764e57e2d341103565f413a64f242d64b1f7024346a2e1'
const installId = '11f6d3e524f367952cb838bf7ef24e0cfb5865d7b8a8fe5c699f748b2fada249'
const timestamp = 1623129204183

describe('User checkUser', () => {
    test("is find user", async () => {
        {
            const _user1 = new User()

            // mock db return true
            _user1.DBOperator.userDao.findUser = () => ({
                user_id: 'test_id',
                third_party_id: 'test_thirdPartyId',
                install_id: 'test_installId',
                timestamp: 'test_timestamp',
                backup_status: 'test_isBackup',
            })

            const checkUser = await _user1.checkUser()
            expect(checkUser).toBe(true);
            expect(_user1.id).toBe('test_id');
        }
    });

    test("not found user", async () => {
        {
            const _user2 = new User()
            const checkUser = await _user2.checkUser()
            expect(checkUser).toBe(false);
        }
    });
})

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

test("User createUser ", async () => {
    {
        const _user1 = new User()

        // mock api response
        _user1._HTTPAgent = {
            post: () => ({
                success: true,
                data: {
                    user_id: userId,
                    user_secret: userSecret
                }
            })
        }
        const success = await _user1.createUser(userIdentifier, installId)
        expect(success).toBeTruthy();
    }
});

test("User _registerUser", async () => {
    {
        const _user1 = new User()

        // mock api response
        _user1._HTTPAgent = {
            post: () => ({
                success: true,
                data: {
                    user_id: userId,
                    user_secret: userSecret
                }
            })
        }

        const credentialData = _user1._generateCredentialData({ userIdentifier, userId, userSecret, installId, timestamp })
        const wallet = await PaperWallet.createWallet(credentialData.key, credentialData.password);
        console.log('wallet', JSON.stringify(wallet))
        const privateKey = PaperWallet.recoverFromJson(JSON.stringify(wallet), credentialData.password)
        const seed = await PaperWallet.magicSeed(privateKey);
        const _seed = Buffer.from(seed)
        const extPK = PaperWallet.getExtendedPublicKey(_seed);

        const result = await _user1._registerUser({ extendPublicKey: extPK, installId, wallet, userId, userIdentifier, timestamp })
        expect(result).toBeTruthy();
    }
})

test("User createUserWithSeed ", async () => {
    {
        const _seed = 'e48f77df468d4890f92392568451e7f73e1757c4287c02b04b8b7d9dba063a13';

        const _user1 = new User()

        // mock db return true
        _user1.DBOperator.userDao.insertUser = () => ({
            user_id: 'test_id',
            third_party_id: 'test_thirdPartyId',
            install_id: 'test_installId',
            timestamp: 'test_timestamp',
            backup_status: 'test_isBackup',
        })

        // mock api response
        _user1._HTTPAgent = {
            post: () => ({
                success: true,
                data: {
                    user_id: userId,
                    user_secret: userSecret
                }
            })
        }
        const success = await _user1.createUserWithSeed(userIdentifier, _seed, installId);
        expect(success).toBeTruthy();
    }
})

test('User validPaperWallet', async () => {
    const credential = _user._generateCredentialData({
        userIdentifier, userId, userSecret, installId, timestamp
    })
    const wallet = await PaperWallet.createWallet(credential.key, credential.password);
    const result = _user.validPaperWallet(wallet)
    expect(result).toBeTruthy();
})

test('User restorePaperWallet', async () => {
    const credential = _user._generateCredentialData({
        userIdentifier, userId, userSecret, installId, timestamp
    })
    const wallet = await PaperWallet.createWallet(credential.key, credential.password);
    const keystore = await PaperWallet.walletToJson(wallet);
    const restoreWallet = await _user.restorePaperWallet(keystore, credential.password)
    expect(typeof restoreWallet.address).toBe('string');
})


describe('User checkWalletBackup', () => {
    test("is find user", () => {
        {
            const _user1 = new User()

            // mock db return true
            _user1._DBOperator.userDao.findUser = () => ({
                user_id: 'test_id',
                third_party_id: 'test_thirdPartyId',
                install_id: 'test_installId',
                timestamp: 'test_timestamp',
                backup_status: 'test_isBackup',
            })
            
            const result = _user1.backupWallet();
            expect(result).toBeTruthy();
        }
    });


    test.skip("not found user", () => {
        const result = _user.backupWallet();
        expect(result).toBeFalsy();
    });
});

test('User _initUser', async () => {
    {
        const _user1 = new User()
        _user1._initUser({
            user_id: 'test_id',
            third_party_id: 'test_thirdPartyId',
            install_id: 'test_installId',
            timestamp: 'test_timestamp',
            backup_status: 'test_isBackup',
        })
        expect(_user1.id).toBe('test_id');
    }
})

test("User getPriKey", async () => {
    const _user1 = new User();

    // mock db return true
    const _DBOperator = {
        userDao: {
            findUser: () => ({
                keystore: '{"address":"6a8874bf6426b722990e9918b72ea995508676cd","crypto":{"cipher":"aes-128-ctr","ciphertext":"19fe778619c1aa7e01a1ad504425be754735ccc36f861ded69e8cb0064a07509","cipherparams":{"iv":"b07da3e7f2d1fe9d8aa9a1462a67bcd1"},"mac":"5cea42bb065c5be78a66f5f00dd1f9b535417886b1dc2a9e2e4ff33e35c81327","kdf":"pbkdf2","kdfparams":{"c":262144,"dklen":32,"prf":"hmac-sha256","salt":"062af9d6c46f62703711226469f931e8a8b85035d5486d8956480cd14f4f2f9b"}},"id":"0cbcf064-0e24-4de6-8ae7-58a445575685","version":3}'
            })
        }
    }
    _user1._DBOperator = _DBOperator;

    const credentialData = _user1._generateCredentialData({ userIdentifier, userId, userSecret, installId, timestamp })

    const result = await _user1.getPriKey(credentialData.password, 0, 0);
    expect(result).toBe('3f0e878c684a02c745747211db64ec0c74da71789a6dc6ea19f00d1d58b8effa');
})