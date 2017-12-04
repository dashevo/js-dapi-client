const Message = require('bitcore-message-dash');

class Server {
  constructor() {
    // TODO: pseudo random only, needs to be updated for production
    this.challengeMsg = Math.random().toString(36).substring(7);
  }

  resolveChallenge(txId, signature, SDK) {
    return SDK.Explorer.API.getTx(txId)
      .then((txData) => {
        // TODO: move to bitcore-lib-dash?
        const rawData = txData.vout.filter(o => o.scriptPubKey.asm.includes('OP_RETURN'))[0]
          .scriptPubKey.asm.replace('OP_RETURN ', '');
        const data = JSON.parse(Buffer.from(rawData, 'hex').toString('utf8'));
        const { pubKey } = data;
        return Message(this.challengeMsg).verify(pubKey, signature);
      });
  }
}

module.exports = Server;
