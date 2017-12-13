const { explorerPost } = require('../../Common/ExplorerHelper');

module.exports = {
  getData(regTxIdOrUsername) {
    return explorerPost(`/getuser/${regTxIdOrUsername}`);
  },
};
