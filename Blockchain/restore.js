exports.restore = function () {
  const self = this;
  return async function (query, update) {
    return new Promise(((resolve, reject) => resolve(true)));
  };
};
