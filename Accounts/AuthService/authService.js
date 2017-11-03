const explorerGet = require('../../Common/ExplorerHelper').explorerGet;

exports.AuthService =
    {
      getChallenge: identifier => explorerGet(`/auth/challenge/${identifier}`),
    };

