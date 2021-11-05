module.exports = function({ userId, token, tokenSecret }) {
  return {
    prefId: `${PrefDao.AUTH_ITEM_KEY}-${userId}`,
    token,
    tokenSecret,
  };
}