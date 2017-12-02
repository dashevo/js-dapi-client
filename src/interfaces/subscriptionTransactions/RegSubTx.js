const Message = require('bitcore-message-dash');
const { Script } = require('bitcore-lib-dash');

const Transaction = require('../Transaction');
const Address = require('../Address');
const SubscriptionTransaction = require('./SubscriptionTransaction');

class RegSubscriptionTransaction extends SubscriptionTransaction {

  constructor(username, publicKey) {
    super();
    this._username = username;
    this._publicKey = publicKey;
    this._address = Address.fromPublicKey(publicKey);
  }

  /**
   * Uses utxo from public key address to fund transactions and adds change output to same address.
   * After funding transaction you need to sign it and send it.
   * @param {number} funding in duffs
   * @returns {Promise<RegSubscriptionTransaction>}
   */
  async fund(funding) {
    const message = new Message(`register|${this.username}|${this.publicKey.toString()}`);
    const script = new Script().add('OP_SUBSCRIPTION').add(new Buffer(message, 'hex'));
    this.addOutput(new Output({satoshis: funding, script}));
    const utxo = await this._address.getUTXO();
    this.from(utxo);
    this.change(this._address);
    return this;
  }

}

module.exports = RegSubscriptionTransaction;