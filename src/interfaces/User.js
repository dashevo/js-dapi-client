const { PrivateKey } = require('bitcore-lib-dash');

const Address = require('./Address');
const SubscriptionTransaction = require('./SubscriptionTransaction');
const { userApi } = require('../api');
const { userEvents, servicesEvents, subTxTypes } = require('../constants');
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

  static async findUsers() {}

  async authenticate() {}
  async register(funding) {
    const utxo = await this.address.getUTXO();
    const regSubTx = new SubscriptionTransaction(
        subTxTypes.register,
        this.username,
        this.publicKey,
        funding
      )
      .from(utxo)
      .change(this.address)
      .sign(this.privateKey);
    await regSubTx.send();
  }
  async topup(funding) {}
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
}