const MockServer = require('./mocks/server');
const Message = require('bitcore-message-dash');

const login = (txId, privateKey) => {
  const server = new MockServer();
  const signature = new Message(server.challengeMsg).sign(privateKey);
  return server.resolveChallenge(txId, signature);
};

module.exports = {
  login,
};
