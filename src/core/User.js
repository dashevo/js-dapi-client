const { PrivateKey } = require('bitcore-lib-dash');
const EventEmitter = require('eventemitter2');

const Address = require('./Address');
const api = require('../api');
const { RegSubTx, TopUpSubTx } = require('./subscriptionTransactions');

class User extends EventEmitter {
  constructor(username, privateKeyString) {
    super();
    this.username = username;
    this.privateKey = new PrivateKey(privateKeyString);
    this.publicKey = this.privateKey.toPublicKey();
    this.address = new Address(this.publicKey);
  }

  /**
   * Makes call to dapi in order to retrieve user data
   * @param {string} usernameOrRegTxId
   * @returns {Promise<Buffer|undefined|*|string>}
   */
  static async getUserData(usernameOrRegTxId) {
    return api.user.getUser(usernameOrRegTxId);
  }

  /**
   * Create registration subscription transaction for that user.
   * Funding must be greater that unspent balance on address related to user's public key.
   * @param {number} funding
   * @returns {Promise<User>}
   */
  async register(funding) {
    const regSubTx = new RegSubTx(this.username, this.privateKey);
    const inputs = await this.address.getUTXO();
    // todo: check that unspent inputs are bigger than funding
    if (!inputs || !inputs.length) {
      throw new Error(`No inputs were found on address ${this.address.toString()} to fund registration`);
    }
    await regSubTx.fund(funding, inputs);
    regSubTx.sign(this.privateKey);
    this.regTxId = await regSubTx.send();
    return this;
  }

  async topUp(funding, inputs, changeAddress, privateKey) {
    const topUpSubTx = new TopUpSubTx(this.regTxId);
    await topUpSubTx.fund(funding, inputs, changeAddress);
    topUpSubTx.sign(privateKey);
    return topUpSubTx.send();
  }
}

module.exports = User;
