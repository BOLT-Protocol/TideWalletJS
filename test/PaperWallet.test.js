const PaperWallet = require("../src/cores/PaperWallet");

test("getExtendedPublicKey", () => {
    const seed = Buffer.from('35f8af7f1bdb4c53446f43c6f22ba0b525634ab556229fffd0f1813cc75b3a2c', 'hex');
    const exPub = PaperWallet.getExtendedPublicKey(seed)

    expect(exPub).toBe('xpub6CFP3LWKoXn9p3YrJ5RygQHKba9p2QJ8dk7uqe3XxhjZrRH9EUnsExXy4EMTPkDrZ77npmeo12negCaXKiWiVro5JUcPYLxHCYBkTQJxiKV');

});
