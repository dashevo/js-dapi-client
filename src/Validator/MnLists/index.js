const { MerkleProof } = require('@dashevo/dash-spv');

const verifyMnListDiff =
    (header, flags, hashes, numTransactions, cbTxHash) =>
      MerkleProof.validateMnProofs(header, flags, hashes, numTransactions, cbTxHash);

module.exports = verifyMnListDiff;

