const User = require("../src/cores/User");

test("test", () => {
    // const seed = Buffer.from('35f8af7f1bdb4c53446f43c6f22ba0b525634ab556229fffd0f1813cc75b3a2c', 'hex');
    const _user = new User()
    let nonce = '0xcafeca';

    const tmp = _user._getNonce('35f8af7f1bdb4c53446f43c6f22ba0b525634ab556229fffd0f1813cc75b3a2c', nonce)
    nonce =`0x${(Number(nonce)+1).toString(16)}`
    console.log('nonce:', nonce);
    console.log('tmp:', tmp);
    const tmp2 = _user._getNonce('35f8af7f1bdb4c53446f43c6f22ba0b525634ab556229fffd0f1813cc75b3a2c', nonce)
    nonce =`0x${(Number(nonce)+1).toString(16)}`
    console.log('nonce:', nonce);
    console.log('tmp:', tmp2);
    const tmp3 = _user._getNonce('35f8af7f1bdb4c53446f43c6f22ba0b525634ab556229fffd0f1813cc75b3a2c', nonce)
    nonce =`0x${(Number(nonce)+1).toString(16)}`
    console.log('nonce:', nonce);
    console.log('tmp:', tmp3);
    const tmp4 = _user._getNonce('35f8af7f1bdb4c53446f43c6f22ba0b525634ab556229fffd0f1813cc75b3a2c', nonce)
    nonce =`0x${(Number(nonce)+1).toString(16)}`
    console.log('nonce:', nonce);
    console.log('tmp:', tmp4);
    const tmp5 = _user._getNonce('35f8af7f1bdb4c53446f43c6f22ba0b525634ab556229fffd0f1813cc75b3a2c', nonce)
    nonce =`0x${(Number(nonce)+1).toString(16)}`
    console.log('nonce:', nonce);
    console.log('tmp:', tmp5);
    const tmp6 = _user._getNonce('35f8af7f1bdb4c53446f43c6f22ba0b525634ab556229fffd0f1813cc75b3a2c', nonce)
    nonce =`0x${(Number(nonce)+1).toString(16)}`
    console.log('nonce:', nonce);
    console.log('tmp:', tmp6);

    expect(tmp).toBe('xpub6CFP3LWKoXn9p3YrJ5RygQHKba9p2QJ8dk7uqe3XxhjZrRH9EUnsExXy4EMTPkDrZ77npmeo12negCaXKiWiVro5JUcPYLxHCYBkTQJxiKV');

});
