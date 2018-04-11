const MNDiscovery = require('../services/MNDiscoveryService');
const rpcClient = require('../utils/RPCClient');
const config = require('../config');

class DAPI {
  /**
   * @param {Array<Object>} seeds
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
  getUTXO(address) { return this.makeRequestToRandomDAPINode('getUTXO', [address]); }

  /**
   * Returns balance for a given address
   * @param {string} address
   * @returns {Promise<number>} - address balance
   */
  getBalance(address) { return this.makeRequestToRandomDAPINode('getBalance', [address]); }

  /**
   * Returns blockchain user by its username or regtx id
   * @param {string} usernameOrRegTxId
   * @returns {Promise<Object>} - blockchain user
   */
  getUser(usernameOrRegTxId) { return this.makeRequestToRandomDAPINode('getUser', [usernameOrRegTxId]); }

  /**
   * Sends serialized transaction to the network
   * @param {string} rawTx - hex string representing serialized transaction
   * @returns {Promise<string>} - transaction id
   */
  sendRawTransaction(rawTx) { return this.makeRequestToRandomDAPINode('sendRawTransaction', [rawTx]); }

  /**
   * Sends serialized state transition header and data packet
   * @param {string} rawTransition - hex string representing state transition header
   * @param {string} dataPacket - hex string representing state transition data
   * @returns {Promise<string>} - header id
   */
  sendRawTransition(rawTransition, dataPacket) {
    return this.makeRequestToRandomDAPINode('sendRawTransition', [rawTransition, dataPacket]);
  }

  /**
   * Returns best block height
   * @returns {Promise<number>}
   */
  getBestBlockHeight() { return this.makeRequestToRandomDAPINode('getBestBlockHeight', []); }

  /**
   * Returns block hash for the given height
   * @param {number} blockHeight
   * @returns {Promise<string>} - block hash
   */
  getBlockHash(blockHeight) { return this.makeRequestToRandomDAPINode('getBlockHash', [blockHeight]); }

  /**
   * ONLY FOR TESTING PURPOSES WITH REGTEST. WILL NOT WORK ON TESTNET/LIVENET.
   * @param {number} amount - Number of blocks to generate
   * @returns {Promise<string[]>} - block hashes
   */
  generate(amount) { return this.makeRequestToRandomDAPINode('generate', [amount]); }

  // Here go methods that used in VMN. Most of this methods will work only in regtest mode
  searchUsers(pattern) { return this.makeRequestToRandomDAPINode('searchUsers', [pattern]); }
  getDapContract(dapId) { return this.makeRequestToRandomDAPINode('getDapContract', [dapId]); }
  searchDapContracts(pattern) { return this.makeRequestToRandomDAPINode('searchDapContracts', [pattern]); }
  getUserDapSpace(dapId, userId) { return this.makeRequestToRandomDAPINode('getUserDapSpace', [userId, dapId]); }
  getUserDapContext(dapId, userId) { return this.makeRequestToRandomDAPINode('getUserDapContext', [userId, dapId]); }
}

module.exports = DAPI;
