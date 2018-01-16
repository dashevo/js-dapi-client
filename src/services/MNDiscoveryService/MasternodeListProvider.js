const { Client: RPCClient } = require('jayson/promise');
const sample = require('lodash/sample');
const config = require('../../config/index');

/**
 * This module is needed for discovering masternode addresses.
 * No need to use this module manually - it's part of MNDiscoveryService.
 * @type {{masternodeList: {protocol: string, host: string, port: number}[], lastUpdateDate: number, fetchMNList(): Promise<Array>, updateMNList(): Promise<void>, needsUpdate(): boolean, getMNList(): Promise<Array>}}
 */
const masternodeListProvider = {
  /**
   * Masternode list. Initial masternode list is DNS seed from SDK config.
   */
  masternodeList: config.DAPIDNSSeeds.slice(),
  lastUpdateDate: 0,
  /**
   * @private
   * Fetches masternode list from DAPI.
   * @returns {Promise<Array>}
   */
  async fetchMNList() {
    const randomMasternode = sample(this.masternodeList);
    const client = RPCClient.http({
      host: randomMasternode.host,
      port: randomMasternode.port,
    });
    const res = await client.request('getMNList', []);
    if (res.error) {
      throw new Error(res.error.message);
    }
    return res.result;
  },
  /**
   * @private
   * Updates masternodes list. No need to call it manually
   * @returns {Promise<void>}
   */
  async updateMNList() {
    const newMNList = await this.fetchMNList();
    this.masternodeList = config.DAPIDNSSeeds.slice().concat(newMNList);
    this.lastUpdateDate = Date.now();
  },
  /**
   * Checks whether masternode list needs update
   * @returns {boolean}
   */
  needsUpdate() {
    return Date.now() - config.masternodeUpdateInterval > this.lastUpdateDate;
  },
  /**
   * Returns masternode list
   * @returns {Promise<Array>}
   */
  async getMNList() {
    if (this.needsUpdate()) {
      await this.updateMNList();
    }
    return this.masternodeList;
  },
};

module.exports = masternodeListProvider;
