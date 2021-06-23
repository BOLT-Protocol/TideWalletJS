// const env = 'production';
const env = 'development';
const apiVersion = '/api/v1';
const apiKey = '';
const apiSecret = '';

const url = env === 'production' ? 'https://service.tidewallet.io' : 'https://staging.tidewallet.io';

const network_publish = false;
// const network_publish = true;

module.exports = {
    url: url + apiVersion,
    apiKey,
    apiSecret,
    installId: '',
    network_publish
}