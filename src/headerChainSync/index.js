/**
 * This module's responsibility is to sync the header chain in a parallelized
 * fashion from random set of distributed masternodes. The header chain is
 * the needed by a SPV-client (light client) for the three Simple Verifications
 * of Dash blockchain data:
 *
 * SPV - Simple Payment Verification (transaction verification),
 * SOV - Simple Object Verification (DashDrive document verification) and
 * SQV - Simple Quorum Verification (Quorum verification)
 *
 * The main function sync() should be called only once upon startup of the dApp
 * to get the new headers of the blocks which have been mined on the Dash blockchain
 * since the dApp last disconnected or upon first startup.
 *  @module HeaderChainSync
 */

const HeaderChainProvider = require('./HeaderChainProvider');

class HeaderChainSync {
  /**
   * @class
   * @param {DAPIClient} api - required. Specifies DAPI client instance
   * @param {object} options
   * @param {int} options.mnListLength - required. Specifies the length of masternode list
   * @param {string} [options.network="mainnet"] - optional. Specifies Dash network type
   */
  constructor(api, { mnListLength, network = 'mainnet' }) {
    this.mnListLength = mnListLength;
    this.network = network;

    /**
     * @private
     * @protected
     * For test purposes only: tests wraps .getMNList() method of that object to ensure
     * it was called.
     */
    this.headerChainProvider = new HeaderChainProvider(api, { mnListLength, network });
    /**
     * @private
     * @protected
     * @type {DAPIClient}
     */
    this.api = api;
  }

  /**
   * @param {number} lastChainTipHeight - height of the last header stored
   * @returns {Promise<Array<Object>>}
   */
  sync(lastChainTipHeight) {
    return this.headerChainProvider.sync(lastChainTipHeight);
  }

  /**
   * @private
   * Deletes cached MNList and resets it back to initial seed.
   * Used in MNDiscovery tests; No need to call that method manually.
   * @return void
   */
  reset() {
    this.headerChainProvider = new HeaderChainProvider(
      this.api,
      {
        mnListLength: this.mnListLength,
        network: this.network,
      },
    );
  }
}

module.exports = HeaderChainSync;
