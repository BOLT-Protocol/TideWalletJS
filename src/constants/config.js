const env = 'production';
const apiVersion = '/api/v1';

const url = env === 'production' ? 'https://service.tidewallet.io' : 'https://staging.tidewallet.io';

module.exports = {
    url: url + apiVersion
}