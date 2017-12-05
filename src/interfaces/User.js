const { PrivateKey } = require('bitcore-lib-dash');
const EventEmitter = require('eventemitter2');

const Address = require('./Address');
const SubscriptionTransaction = require('./subscriptionTransactions/SubscriptionTransaction');
const { userApi } = require('../api');
const { RegSubTx } = require('./subscriptionTransactions');
const { userEvents, servicesEvents } = require('../constants');
const { blockchainNotificationsService } = require('../services');

class User extends EventEmitter {

  constructor(username, privateKeyString) {
    super();
    this.username = username;
    this.privateKey = new PrivateKey(privateKeyString);
    this.publicKey = this.privateKey.toPublicKey();
    this.address = new Address(this.publicKey);

    blockchainNotificationsService.on(servicesEvents.NEW_BLOCK, this._fetchState);
  }

  /**
   * Create registration subscription transaction for that user.
   * Funding must be greater that unspent balance on address related to user's public key.
   * @param {number} funding
   * @returns {Promise<User>}
   */
  async register(funding) {
    const regSubTx = new RegSubTx(this.username, this.privateKey);
    await regSubTx.fund(funding);
    regSubTx.sign(this.privateKey);
    await regSubTx.send();
    return this;
  }

  static async findUsers() {}

  async authenticate() {}
  async topUp(funding) {}
  async closeSubscription() {}
  async changeKey(newKey) {}
  async getUserData() {}

  /**
   * It is crucial for EventEmitters to remove listeners, since if object method still listening to
   * some events on EventEmitter it will prevent object from being garbage collected
   */
  destroySession() {
    blockchainNotificationsService.off(servicesEvents.NEW_BLOCK, this._fetchState)
  }

  /**
   * Internal method that needs to be called if user state was updated
   * @returns {Promise.<void>}
   * @private
   */
  async _fetchState() {
    // ...
    this.emit(userEvents.STATE_UPDATED)
  }

  fromString() {

  }

  fromBuffer() {

  }

  // todo
  toJson() {

  }
  // todo
  toHex() {

  }

  // todo
  toString() {

  }
}

module.exports = User;