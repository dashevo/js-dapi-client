/**
 * This module responsibility is to obtain masternode IPs in order to
 * provide those IPs for DAPIService, which provides an interface for making
 * requests to DAPI.
 *  @module MNDiscoveryService
 */

const sample = require('lodash/sample');
const MasternodeListProvider = require('./MasternodeListProvider');

const masternodeListProvider = new MasternodeListProvider();

const MNDiscoveryService = {
  /**
   * @returns {Promise<Masternode>}
   */
  async getRandomMasternode() {
    const MNList = await masternodeListProvider.getMNList();
    return sample(MNList);
  },
  /**
   * @returns {Promise<Array<Masternode>>}
   */
  getMNList() {
    return masternodeListProvider.getMNList();
  },
};

module.exports = MNDiscoveryService;
