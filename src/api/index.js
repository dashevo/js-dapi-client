const MNDiscovery = require('../services/MNDiscoveryService');
const rpcClient = require('../utils/RPCClient');
const config = require('../config');

class DAPI {
  /**
   * @param {Array<Object>} [seeds] - seeds. If no seeds provided, default seed will be used.
   */
  constructor(seeds) {
    this.MNDiscovery = new MNDiscovery(seeds);
  }

  /**
   * @private
   * @param method
   * @param params
   * @returns {Promise<*>}
   */
  async makeRequestToRandomDAPINode(method, params) {
    const randomMasternode = await this.MNDiscovery.getRandomMasternode();
    return rpcClient.request({ host: randomMasternode.ip, port: config.Api.port }, method, params);
  }

  /**
   * Returns UTXO for given address
   * @param {string} address
   * @returns {Promise<Array<Object>>} - array of unspent outputs
   */
  getUTXO(address) { return this.makeRequestToRandomDAPINode('getUTXO', { address }); }

  /**
   * Returns balance for a given address
   * @param {string} address
   * @returns {Promise<number>} - address balance
   */
  getBalance(address) { return this.makeRequestToRandomDAPINode('getBalance', { address }); }

  /**
   * Returns blockchain user by its username or regtx id
   * @param {string} usernameOrRegTxId
   * @returns {Promise<Object>} - blockchain user
   */
  getUser(usernameOrRegTxId) { return this.makeRequestToRandomDAPINode('getUser', [usernameOrRegTxId]); }

  /**
   * Sends serialized transaction to the network
   * @param {string} rawTransaction - hex string representing serialized transaction
   * @returns {Promise<string>} - transaction id
   */
  sendRawTransaction(rawTransaction) { return this.makeRequestToRandomDAPINode('sendRawTransaction', { rawTransaction }); }

  /**
   * Sends serialized state transition header and data packet
   * @param {string} rawTransitionHeader - hex string representing state transition header
   * @param {string} rawTransitionPacket - hex string representing state transition data
   * @returns {Promise<string>} - header id
   */
  sendRawTransition(rawTransitionHeader, rawTransitionPacket) {
    return this.makeRequestToRandomDAPINode('sendRawTransition', { rawTransitionHeader, rawTransitionPacket });
  }

  /**
   * Returns best block height
   * @returns {Promise<number>}
   */
  getBestBlockHeight() { return this.makeRequestToRandomDAPINode('getBestBlockHeight', {}); }

  /**
   * Returns block hash for the given height
   * @param {number} height
   * @returns {Promise<string>} - block hash
   */
  getBlockHash(height) { return this.makeRequestToRandomDAPINode('getBlockHash', { height }); }

  /**
   * Returns block headers from [offset] with length [limit], where limit is <= 250
   * @param {number} offset
   * @param {number} limit
   * @returns {Promise<[objects]>} - array of header objects
   */
  getBlockHeaders(offset, limit) { return this.makeRequestToRandomDAPINode('getBlockHeaders', { offset, limit }); }

  /**
   * ONLY FOR TESTING PURPOSES WITH REGTEST. WILL NOT WORK ON TESTNET/LIVENET.
   * @param {number} amount - Number of blocks to generate
   * @returns {Promise<string[]>} - block hashes
   */
  generate(amount) { return this.makeRequestToRandomDAPINode('generate', { amount }); }

  // Here go methods that used in VMN. Most of this methods will work only in regtest mode
  searchUsers(pattern, limit = 10, offset = 0) { return this.makeRequestToRandomDAPINode('searchUsers', { pattern, limit, offset }); }
  getDapContract(dapId) { return this.makeRequestToRandomDAPINode('getDapContract', { dapId }); }
  searchDapContracts(pattern, limit = 10, offset = 0) { return this.makeRequestToRandomDAPINode('searchDapContracts', { pattern, limit, offset }); }
  getUserDapSpace(dapId, userId) { return this.makeRequestToRandomDAPINode('getUserDapSpace', { userId, dapId }); }
  getUserDapContext(dapId, userId) { return this.makeRequestToRandomDAPINode('getUserDapContext', { userId, dapId }); }

  // Temp methods for SPV testing/POC
  // In future SPV will choose a spesific node and stick with
  // the node for as long as possible for SPV interaction (to prevent dapi chain rescans)
  loadBloomFilter(filter) { return this.makeRequestToRandomDAPINode('loadBloomFilter', { filter }); }
  addToBloomFilter(originalFilter, element) { return this.makeRequestToRandomDAPINode('addToBloomFilter', { originalFilter, element }); }
  clearBloomFilter(filter) { return this.makeRequestToRandomDAPINode('clearBloomFilter', { filter }); }
  getSpvData(filter) { return this.makeRequestToRandomDAPINode('getSpvData', { filter }); }
  requestHistoricData(blockHash) { return this.makeRequestToRandomDAPINode('requestHistoricData', { blockHash }); }
}

module.exports = DAPI;
