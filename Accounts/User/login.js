const mockServer = require('./mocks/server');
const Message = require('bitcore-message-dash');

exports.login = function (txId, privateKey) {
  const server = new mockServer();
  const signature = new Message(server.challengeMsg).sign(privateKey);
  return server.resolveChallenge(txId, signature);
};
