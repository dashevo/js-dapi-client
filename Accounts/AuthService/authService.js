const { explorerGet } = require('../../Common/ExplorerHelper');

const AuthService = {
  getChallenge: identifier => explorerGet(`/auth/challenge/${identifier}`),
};

module.exports = {
  AuthService,
};
