const Message = require('bitcore-message-dash');
const { Script } = require('bitcore-lib-dash');

const Transaction = require('./Transaction');
const { subTxTypes } = require('../constants');

class SubscriptionTransaction extends Transaction {
  constructor(type, username, publicKey, funding) {
    super();

    switch (type) {

      case subTxTypes.register:
        const message = new Message(`register|${username}|${publicKey.toString()}`);
        const script = new Script().add('OP_SUBSCRIPTION').add(new Buffer(message, 'hex'));
        this.addOutput(new Output({satoshis: funding, script}));
        break;

      case subTxTypes.topup:
        break;

      case subTxTypes.resetKey:
        break;

      case subTxTypes.closeSubscription:
        break;

      default:
        throw new Error(`Unrecognized SubTx type ${type}`);
    }

  }

}

module.exports = SubscriptionTransaction;