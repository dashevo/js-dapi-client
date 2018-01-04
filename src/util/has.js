const has = (obj, val) => obj && {}.hasOwnProperty.call(obj, val);

module.exports = {
  has,
};
