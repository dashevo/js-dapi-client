const quorums = require('quorums-dash');
const sample = require('lodash/sample');
const { Client: RPCClient } = require('jayson/promise');
const config = require('../config');

/*
* This module responsibility is to obtain masternode IPs in order to
* provide those IPs for DAPIService, which provides an interface for making
* requests to DAPI.
* Initial masternode list is dns seed - trusted servers which returns list of
* other nodes in the network.
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

const MNDiscoveryService = {
  /**
   *
   * @returns {Promise<*>}
   */
  async getRandomMasternode() {
    const MNList = await masternodeListProvider.getMNList();
    console.log(MNList);
    return sample(MNList);
  },
};

module.exports = MNDiscoveryService;
