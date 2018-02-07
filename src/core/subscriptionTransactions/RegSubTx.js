/* disable this eslint rule since there is method in bitcore with dangle that
 * can not be changed */
/* eslint no-underscore-dangle: "off" */
const { Script, PrivateKey, Message } = require('bitcore-lib-dash');
const { BufferWriter } = require('bitcore-lib-dash').encoding;

const Address = require('../Address');
const Transaction = require('../Transaction');
const { subTxTypes, evoVersion } = require('../../constants');

const { Output } = Transaction;

class RegSubscriptionTransaction extends Transaction {
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
   * @param inputs
   * @returns {Promise<RegSubscriptionTransaction>}
   */
  async fund(funding, inputs) {
    const reversedPubKey = this.publicKey._getID().reverse();
    const pubKeyId = this.publicKey._getID();
    const message = new Message(`register|${this.username}|${reversedPubKey.toString('hex')}`);
    const signature = Buffer.from(message.sign(this.privateKey), 'base64');
    const username = Buffer.from(this.username, 'utf8');

    const registrationData = new BufferWriter()
      .writeUInt32LE(evoVersion)
      .writeUInt8(subTxTypes.REGISTER)
      .writeVarintNum(username.length)
      .write(username)
      .write(pubKeyId)
      .writeVarintNum(signature.length)
      .write(signature)
      .toBuffer();

    const script = new Script()
      .add('OP_NOP10')
      .add(registrationData);

    const output = new Output({ satoshis: funding, script });

    this.from(inputs);
    this.change(this.address);
    this.addOutput(output);
    return this;
  }
}

module.exports = RegSubscriptionTransaction;
