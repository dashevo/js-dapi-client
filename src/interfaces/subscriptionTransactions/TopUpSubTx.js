const { Script } = require('bitcore-lib-dash');
const { Output } = require('bitcore-lib-dash').Transaction;
const { BufferWriter } = require('bitcore-lib-dash').encoding;

const SubscriptionTransaction = require('./SubscriptionTransaction');
const { subTxTypes, nVersion } = require('../../constants');

class RegSubscriptionTransaction extends SubscriptionTransaction {
  constructor(registrationSubTxId) {
    super();
    this.registrationSubTxId = registrationSubTxId;
  }

  /**
   * Uses utxo from public key address to fund transactions and adds change output to same address.
   * After funding transaction you need to sign it and send it.
   * @param {number} funding in duffs
   * @param {array|object} inputs that will be used for topup.
   * Inputs can be obtained by calling address.getUTXO
   * @param {string|Address} changeAddress address to which not spent amount of dash should return
   * @returns {Promise<RegSubscriptionTransaction>}
   */
  async fund(funding, inputs, changeAddress) {
    // We should reverse tx id binary data, as in the core all binary representations
    // of hashes are reversed because of a mistake on early bitcoin development stage
    const regTxId = Buffer.from(this.registrationSubTxId, 'hex').reverse();

    const topUpData = new BufferWriter()
      .writeUInt32LE(nVersion)
      .writeUInt8(subTxTypes.topup)
      .write(regTxId)
      .toBuffer();

    const script = new Script()
      .add('OP_NOP10')
      .add(topUpData);

    const output = new Output({ satoshis: funding, script });

    this.from(inputs);
    this.change(changeAddress);
    this.addOutput(output);
    return this;
  }
}

module.exports = RegSubscriptionTransaction;
