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
  MerkleBlock,
  BlockHeader,
} = require('@dashevo/dashcore-lib');
const sample = require('lodash/sample');
const RPCClient = require('../RPCClient');
const config = require('../config');

const dummyHeader = '000000204644733449affc715f467ff90aeb6f983b174cb1c089811aea53420100000000720668fc7eb874724c9fb50479009b8747d64f7c36bccb8f7b3fe247f346d6ce27f3355c5cd0211c0f94930d';

/**
 * validates proof params of cbTxMerkleTree
 * @param {SimplifiedMNListDiff} diff - masternode list diff
 * @param {string} header - block hash of the ending block of the diff request
 * @returns {boolean}
 */
function isValidDiffListProof(diff, header) {
  const objDiff = SimplifiedMNListDiff.fromObject(diff);
  const merkleBlock = new MerkleBlock({
    header,
    numTransactions: objDiff.cbTxMerkleTree.totalTransactions,
    hashes: objDiff.cbTxMerkleTree.merkleHashes,
    flags: objDiff.cbTxMerkleTree.merkleFlags,
  });

  return merkleBlock.validMerkleTree() && merkleBlock.hasTransaction(objDiff.cbTx);
}

/**
 * verifies masternode list diff against local header chain
 * @param {string} blockHash
 * @returns {Promise<BlockHeader>}
 */
async function getHeaderFromLocalChain(blockHash) { // eslint-disable-line no-unused-vars
// TODO: implement local headerChain with lightning fast dspv sync
// the following commented lines just a dummy to simulate a header store
// const headerChain = new SpvChain('testnet');
// const header = BlockHeader.fromString(await headerChain.getHeader(blockHash));
  const header = BlockHeader.fromString(dummyHeader);
  if (!header) {
    throw new Error(`Failed to find cbTxHeader in local store for block hash ${blockHash}`);
  }

  return header;
}

/**
 * validates masternode list diff against local header chain and merkle proof
 * @param {SimplifiedMNListDiff} diff - masternode list diff
 * @returns {Promise<boolean>}
 */
async function validateDiff(diff) {
  // TODO: enable below once we have a local header chain
  const validHeader = await getHeaderFromLocalChain(diff.blockHash);
  if (!validHeader) {
    return false;
  }

  // dummy header
  if (!isValidDiffListProof(diff, validHeader)) {
    throw new Error('Invalid masternode diff proofs');
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
    this.simplifiedMNList = new SimplifiedMNList();
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
    return this.simplifiedMNList.applyDiff(diff).getValidMasternodesList();
  }

  /**
   * @private
   * Fetches masternode diff from DAPI.
   * @returns {Promise<SimplifiedMNListDiff>}
   */
  async getSimplifiedMNListDiff() {
    const node = sample(this.masternodeList);
    const baseHash = this.baseBlockHash;
    const ipaddress = node.service.split(':')[0];
    const blockHash = await RPCClient.request({
      host: ipaddress,
      port: this.DAPIPort,
    }, 'getBestBlockHash', {});
    if (!blockHash) {
      throw new Error(`Failed to get best block hash for getSimplifiedMNListDiff from node ${ipaddress}`);
    }
    const diff = await RPCClient.request({
      host: ipaddress,
      port: this.DAPIPort,
    }, 'getMnListDiff', { baseHash, blockHash });
    if (!diff) {
      throw new Error(`Failed to get mn diff from node ${ipaddress}`);
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
