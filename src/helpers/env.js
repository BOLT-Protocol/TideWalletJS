var isBrowser = function () {
  try {
    return this === window;
  } catch (e) {
    return false;
  }
};

module.exports = {
  isBrowser
};
