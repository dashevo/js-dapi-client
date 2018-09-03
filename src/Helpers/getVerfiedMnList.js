const Client = require('../');
// Add this code back when proofs available.
// const { MerkleProof } = require('dash-spv');

const client = new Client();

function getBestBlockHash() {
  return client.getBestBlockHeight()
    .then(height => client.getBlockHash(height));
}

function constructMnList(originalMnList, latestMnList) {
  return originalMnList
    .filter(mn => !latestMnList.deletedMNs.includes(mn.proRegTxHash))
    .concat(latestMnList.mnList)
    .sort((itemA, itemB) => itemA.proRegTxHash > itemB);
}

function validateDiffListProofs(mnlistDiff, header, newList) {
  // Todo: pending core RPC bug currently not returning these proofs
  // rem next line when proofs available
  return mnlistDiff && header && newList;

  // Add this code back when proofs available.
  // return MerkleProof.validateMnProofs(
  //   header,
  //   mnlistDiff.merkleFlags,
  //   mnlistDiff.merkleHashes,
  //   mnlistDiff.totalTransactions,
  //   mnlistDiff.cbTx.hash,
  // ) &&
  // MerkleProof.validateMnListMerkleRoot(mnlistDiff.mnlistMerkleRoot, newList);
}

// Todo: pending core RPC bug currently not returning these proofs
/* eslint-disable no-param-reassign */
function stubDiffList(mnListDiff) {
  mnListDiff.totalTransactions = 0;
  mnListDiff.merkleHashes = [];
  mnListDiff.merkleFlags = [];
  mnListDiff.cbTx = {};

  return mnListDiff;
}

const nullhash = '0000000000000000000000000000000000000000000000000000000000000000';
async function getVerfiedMnList(_targetHash, offSetHash = nullhash, lastSyncedMnList = []) {
  const targetHash = await getBestBlockHash();
  const latestHeader = await client.getBlockHeader(targetHash);
  const candidateList = await client.getMnListDiff(offSetHash, targetHash);
  const newList = constructMnList(lastSyncedMnList, candidateList);

  // Todo: pending core RPC bug
  stubDiffList(candidateList);

  while (!validateDiffListProofs(candidateList, latestHeader, newList)) {
    // Todo get new mnlist from different node until a list is obtained
    // which does validate correctly
  }
  return newList;
}

module.exports = getVerfiedMnList;

