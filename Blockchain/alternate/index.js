exports.Blockchain = function () {
  const self = this;
  return {
    init: require('./init').init,
  };
};

require('./init').init();
