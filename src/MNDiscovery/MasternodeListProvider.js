/**
 * This module provides list of masternode addresses.
 * No need to use this module manually - it's part of MNDiscovery.
 * It is written as class for testability purposes - there is need to be a way to
 * reset internal state of object.
 * @module MasternodeListProvider
 */

const { SpvChain } = require('@dashevo/dash-spv');
const { SimplifiedMNList, MerkleBlock } = require('@dashevo/dashcore-lib');
const sample = require('lodash/sample');
const RPCClient = require('../RPCClient');
const config = require('../config');

/**
 * validates proof params of cbTxMerkleTree
 * @param {SimplifiedMNListDiff} diff - masternode list diff
 * @param {string} header - block hash of the ending block of the diff request
 * @returns {boolean}
 */
function isValidDiffListProof(diff, header) {
  const merkleBlock = new MerkleBlock({
    header,
    numTransactions: diff.cbTxMerkleTree.totalTransactions,
    hashes: diff.cbTxMerkleTree.merkleHashes,
    flags: diff.cbTxMerkleTree.merkleFlags,
  });

  return merkleBlock.validMerkleTree() && merkleBlock.hasTransaction(diff.cbTx.hash);
}

/**
 * validates masternode list diff against local header chain and merkle proof
 * @param {SimplifiedMNListDiff} diff - masternode list diff
 * @returns {Promise<boolean>}
 */
async function validateDiff(diff) {
  // TODO: enable below once we have a local header chain
  /*
  const validHeader = await isHeaderInLocalChain(diff.blockHash);
  if (!validHeader) {
    return false;
  }
 */
  if (!isValidDiffListProof(diff, diff.blockHash)) {
    throw new Error('Invalid masternode diff proofs');
  }

  return true;
}

/**
 * verifies masternode list diff against local header chain
 * @param {string} blockHash
 * @returns {Promise<boolean>}
 */
async function isHeaderInLocalChain(blockHash) { // eslint-disable-line no-unused-vars
  // TODO: implement local headerChain with lightning fast dspv sync
  // the following line is just a dummy to simulate a header store
  const headerChain = new SpvChain('testnet');
  const header = await headerChain.getHeader(blockHash);
  if (!header) {
    throw new Error(`Failed to find cbTxHeader in local store for block hash ${blockHash}`);
  }

  return true;
}

/**
 * This class holds the valid deterministic masternode list
 * and updates it when getMNList() is called after
 * a certain interval has passed. NB: getMNList() returns
 * an array of only valid simplified MN entries and not the entire list.
 * @type {SimplifiedMNListEntry[]}
 * @property {string} proRegTxHash
 * @property {string} confirmedHash
 * @property {string} service - ip and port
 * @property {string} pubKeyOperator - operator public key
 * @property {string} keyIDVoting - public key hash, 20 bytes
 * @property {boolean} isValid
 */

class MasternodeListProvider {
  constructor(seeds, DAPIPort = config.Api.port) {
    const seedsIsArray = Array.isArray(seeds);

    if (seeds && !seedsIsArray) {
      throw new Error('seed is not an array');
    }
    /**
     * Deterministic simplified masternode list.
     * Initial masternode list is DNS seed from config.
     * @type Array<SimplifiedMNListEntry>
     */
    this.masternodeList = seedsIsArray ? seeds.slice() : config.DAPIDNSSeeds.slice();
    this.DAPIPort = DAPIPort;
    this.lastUpdateDate = 0;
    this.baseBlockHash = config.nullHash;
  }

  /**
   * @private
   * Gets valid masternode list from DAPI.
   * @returns {Promise<SimplifiedMNListEntry[]>}
   */
  async getValidMnList() {
    const diff = await this.getSimplifiedMNListDiff();
    if (!diff) {
      // TODO: query other dapi node
      throw new Error('INVALID MNLIST! please query other dapi nodes');
    }
    // TODO: enable once we have a local header chain

    const isValidDiff = await validateDiff(diff);
    if (!isValidDiff) {
      // TODO: query other dapi node
      throw new Error('INVALID MNLIST! please query other dapi nodes');
    }

    return new SimplifiedMNList(diff).getValidMasternodesList();
  }

  /**
   * @private
   * Fetches masternode diff from DAPI.
   * @returns {Promise<SimplifiedMNListDiff>}
   */
  async getSimplifiedMNListDiff() {
    const node = sample(this.masternodeList);
    const { baseBlockHash } = this.baseBlockHash;
    const blockHash = await RPCClient.request({
      host: node.ip,
      port: this.DAPIPort,
    }, 'getBestBlockHash', {});
    if (!blockHash) {
      throw new Error(`Failed to get best block hash for getSimplifiedMNListDiff from node ${node.ip}`);
    }
    const diff = await RPCClient.request({
      host: node.ip,
      port: this.DAPIPort,
    }, 'getMnListDiff', { baseBlockHash, blockHash });
    if (!diff) {
      throw new Error(`Failed to get mn diff from node ${node.ip}`);
    }
    this.baseBlockHash = blockHash;
    return diff;
  }

  /**
   * @private
   * Updates simplified masternodes list. No need to call it manually
   * @returns {Promise<void>}
   */
  async updateMNList() {
    const newMNList = await this.getValidMnList();
    // If mn list was updated
    if (newMNList.length) {
      console.log('newMNList', newMNList);
      this.masternodeList = newMNList;
    }
    this.lastUpdateDate = Date.now();
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
    return this.masternodeList;
  }
}

module.exports = MasternodeListProvider;
