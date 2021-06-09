const User = require("../src/cores/User");
const PaperWallet = require('../src/cores/PaperWallet')


const _user = new User()
const userIdentifier = '0x123'
const userId = '0x456'
const userSecret = '0x1'
const installId = '0x789'
const timestamp = Math.floor(new Date() / 1000)

test.only("User _getNonce ", () => {
    const nonce = _user._getNonce(userIdentifier)
    expect(nonce).toBe('0xcb002e');
});

test.only("User getPassword ", () => {
    const passwd = _user.getPassword({
        userIdentifier, userId, installId, timestamp
    })
    expect(passwd).toBe('6e68c9174ed0001757c001942a0ef97bf996f489e902e99ef3abe4d1c5bbe96c');
});


test.only("User _generateCredentialData ", () => {
    const credential = _user._generateCredentialData({
        userIdentifier, userId, userSecret, installId, timestamp
    })
    expect(credential.key).toBe('21d6d820188914741f9b5df762ca7470d8153ef9fda36553c44ec9df9e9bf95c');
    expect(credential.password).toBe('6e68c9174ed0001757c001942a0ef97bf996f489e902e99ef3abe4d1c5bbe96c');
    expect(credential.extend).toBe('0x5eb8');
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
