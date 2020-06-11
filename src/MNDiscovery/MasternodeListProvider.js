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
const config = require('../config');
const constants = require('../constants');

const dummyHeader = '00000020306754be5d6e242258b1ab03999eaa847724718cd410c69a0a92b21300000000ba7f1c1dc4ae5c849813d36a9efa961d3b178489afd6a9bed50de43a2223246e7867335cfc64171cd152f10e';

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
async function validateDiff(diff) { // eslint-disable-line no-unused-vars
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
    if (!diff) {
      // TODO: query other dapi node
      throw new Error('Can\'t fetch MN list');
    }
    // TODO: enable once we have a local header chain
    /*
    const isValidDiff = await validateDiff(diff);
    if (!isValidDiff) {
      // TODO: query other dapi node
      throw new Error('INVALID MNLIST! please query other dapi nodes');
    }
    */
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

    return diff;
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
