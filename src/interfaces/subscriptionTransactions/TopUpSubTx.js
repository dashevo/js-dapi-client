const Message = require('bitcore-message-dash');
const { Script, PrivateKey } = require('bitcore-lib-dash');
const { Output } = require('bitcore-lib-dash').Transaction;
const { BufferWriter } = require('bitcore-lib-dash').encoding;

const Address = require('../Address');
const SubscriptionTransaction = require('./SubscriptionTransaction');
const { subTxTypes, nVersion } = require('../../constants');

class RegSubscriptionTransaction extends SubscriptionTransaction {
  constructor(username, privateKey) {
    super();
    this.username = username;
    this.privateKey = new PrivateKey(privateKey);
    this.publicKey = this.privateKey.toPublicKey();
    this.address = Address.fromPublicKey(this.publicKey);
  }

  /**
   * Uses utxo from public key address to fund transactions and adds change output to same address.
   * After funding transaction you need to sign it and send it.
   * @param {number} funding in duffs
   * @param [inputs]
   * @returns {Promise<RegSubscriptionTransaction>}
   */
  async fund(funding, inputs) {
    const pubKeyId = this.publicKey._getID();
    const username = Buffer.from(this.username, 'utf8');

    const topUpData = new BufferWriter()
      .writeUInt32LE(nVersion)
      .writeUInt8(subTxTypes.topup)
      .writeVarintNum(username.length)
      .write(username)
      .write(pubKeyId)
      .toBuffer();

    const script = new Script()
      .add('OP_NOP10')
      .add(topUpData);

    const output = new Output({ satoshis: funding, script });

    let utxo = inputs;
    if (!inputs) {
      utxo = await this.address.getUTXO();
    }
    this.from(utxo);
    this.change(this.address);
    this.addOutput(output);
    return this;
  }
}

module.exports = RegSubscriptionTransaction;
