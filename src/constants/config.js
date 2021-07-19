// const env = 'production';
const env = "development";
const apiVersion = "/api/v1";
const apiKey = "yourKey";
const apiSecret = "yourSecret";

const url =
  env === "production"
    ? "https://service.tidewallet.io"
    : "https://staging.tidewallet.io";

const network_publish = true;

module.exports = {
  url: url + apiVersion,
  apiKey,
  apiSecret,
  installId: "",
  network_publish,
  debug_mode: env === "production" ? false : true,
};
