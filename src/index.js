
const PaperWallet = require('./cores/PaperWallet');


const tidewallet = {
    PaperWallet
}

module.exports = tidewallet;

// TODO: Remove Try Catch
try {
    if (window) {
        window.Buffer = require('buffer').Buffer;
        window.tidewallet = tidewallet
    }

} catch(e) {

}