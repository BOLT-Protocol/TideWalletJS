const rlp = require("../src/helpers/rlp");
const User = require("../src/cores/User");


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

test.only("User getPassword ", () => {
    const passwd = _user.getPassword({
        userIdentifier, userId, installId, timestamp
    })
    console.log('passwd:', passwd);
    expect(passwd).toBe('72012f0e20235377c36eaee6c1daf6e49e172b63c21091a480c0f44bdfebbe1b');
});

// test("userid + usernonce -> seed", () => {
// })

// test("User _generateCredentialData ", () => {
//     const credential = _user._generateCredentialData({
//         userIdentifier, userId, userSecret, installId, timestamp
//     })
//     expect(credential.key).toBe('21d6d820188914741f9b5df762ca7470d8153ef9fda36553c44ec9df9e9bf95c');
//     expect(credential.password).toBe('6e68c9174ed0001757c001942a0ef97bf996f489e902e99ef3abe4d1c5bbe96c');
//     expect(credential.extend).toBe('0x5eb8');
// });
