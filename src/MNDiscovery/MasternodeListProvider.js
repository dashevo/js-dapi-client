/**
 * This module provides list of masternode addresses.
 * No need to use this module manually - it's part of MNDiscovery.
 * It is written as class for testability purposes - there is need to be a way to
 * reset internal state of object.
 * @module MasternodeListProvider
 */

const {
  SimplifiedMNList,
  SimplifiedMNListDiff,
} = require('@dashevo/dashcore-lib');
const config = require('../config');
const constants = require('../constants');

/**
 * This class holds the valid deterministic masternode list
 * and updates it when getMNList() is called after
 * a certain interval has passed. NB: getMNList() returns
 * an array of only valid simplified MN entries and not the entire list.
 *
 * @class
 */
class MasternodeListProvider {
  /**
   * @param {JsonRpcTransport} jsonRpcTransport
   */
  constructor(jsonRpcTransport) {
    this.jsonRpcTransport = jsonRpcTransport;
    /**
     * Deterministic simplified masternode list.
     * @type Array<SimplifiedMNListEntry>
     */
    this.simplifiedMNList = new SimplifiedMNList();
    this.lastUpdateDate = 0;
    this.baseBlockHash = constants.masternodeList.NULL_HASH;
  }

  /**
   * @private
   * temp function to get genesisHash for use
   * instead of nullHash due to core bug
   * @returns {string} hash - genesis hash
   */
  async getGenesisHash() {
    const genesisHeight = 0;

    return this.jsonRpcTransport.makeRequest(
      'getBlockHash',
      { height: genesisHeight },
    );
  }

  /**
   * @private
   * Updates simplified masternodes list. No need to call it manually
   * @returns {Promise<void>}
   */
  async updateMNList() {
    if (this.baseBlockHash === config.nullHash) {
      this.baseBlockHash = await this.getGenesisHash();
    }
    const diff = await this.getSimplifiedMNListDiff();

    this.simplifiedMNList.applyDiff(diff);

    if (!this.simplifiedMNList) {
      throw new Error('simplifiedMNList is empty');
    }
    const validMasternodesList = this.simplifiedMNList.getValidMasternodesList();
    if (!validMasternodesList.length) {
      throw new Error('No MNs in list. Can\'t connect to the network.');
    }

    this.jsonRpcTransport.mnDiscovery.setMNList(validMasternodesList);

    this.baseBlockHash = diff.blockHash;
    this.lastUpdateDate = Date.now();
  }

  /**
   * @private
   * Fetches masternode diff from DAPI.
   * @returns {Promise<SimplifiedMNListDiff>}
   */
  async getSimplifiedMNListDiff() {
    const { baseBlockHash } = this;

    const blockHash = await this.jsonRpcTransport.makeRequest(
      'getBestBlockHash',
      {},
    );

    if (!blockHash) {
      throw new Error('Failed to get best block hash for getSimplifiedMNListDiff');
    }

    const diff = await this.jsonRpcTransport.makeRequest(
      'getMnListDiff',
      { baseBlockHash, blockHash },
    );

    if (!diff) {
      throw new Error('Failed to get mn diff');
    }

    return new SimplifiedMNListDiff(diff, 'testnet');
  }

  /**
   * @private
   * Checks whether simplified masternode list needs update
   * @returns {boolean}
   */
  needsUpdate() {
    return Date.now() - config.MNListUpdateInterval > this.lastUpdateDate;
  }

  /**
   * Returns simplified masternode list
   * @returns {Promise<Array<SimplifiedMNListEntry>>}
   */
  async getMNList() {
    if (this.needsUpdate()) {
      await this.updateMNList();
    }
    return this.jsonRpcTransport.mnDiscovery.getMNList();
  }
}

module.exports = MasternodeListProvider;
