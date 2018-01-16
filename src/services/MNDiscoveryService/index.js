const sample = require('lodash/sample');
const MasternodeListProvider = require('./MasternodeListProvider');

/*
* This module responsibility is to obtain masternode IPs in order to
* provide those IPs for DAPIService, which provides an interface for making
* requests to DAPI.
* Initial masternode list is dns seed - trusted servers which returns list of
* other nodes in the network.
*/

const MNDiscoveryService = {
  /**
   *
   * @returns {Promise<*>}
   */
  async getRandomMasternode() {
    const MNList = await MasternodeListProvider.getMNList();
    return sample(MNList);
  },
};

module.exports = MNDiscoveryService;
