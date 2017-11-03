const Message = require('bitcore-message-dash');

class Server {
  constructor() {
    this.challengeMsg = Math.random().toString(36).substring(7); // pvr: pseudo random only, needs to be updated for production
  }

  resolveChallenge(txId, signature) {
    const self = this;

    return SDK.Explorer.API.getTx(txId)
      .then((txData) => {
        // pvr: move to bitcore-lib-dash?
        const rawData = txData.vout.filter(o => o.scriptPubKey.asm.includes('OP_RETURN'))[0]
          .scriptPubKey.asm.replace('OP_RETURN ', '');
        const data = JSON.parse(new Buffer(rawData, 'hex').toString('utf8'));
        const pubKey = data.pubKey;
        // /////////////////////////////////

        return Message(this.challengeMsg).verify(pubKey, signature);
      });
  }
}

module.exports = Server;
