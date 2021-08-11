const InvalidResponseError = require('../response/errors/InvalidResponseError');
const ConsensusParamsBlock = require('./ConsensusParamsBlock');
const ConsensusParamsEvidence = require('./ConsensusParamsEvidence');

class GetConsensusParamsResponse {
  /**
   *
   * @param {object} block
   * @param {object} evidence
   */
  constructor(block, evidence) {
    this.block = new ConsensusParamsBlock(
      block.maxBytes,
      block.maxGas,
      block.timeIotaMs,
    );
    this.evidence = new ConsensusParamsEvidence(
      evidence.maxAgeNumBlocks,
      evidence.maxAgeDuration,
      evidence.maxBytes,
    );
  }

  /**
   * @returns {ConsensusParamsBlock}
   */
  getBlock() {
    return this.block;
  }

  /**
   * @returns {ConsensusParamsEvidence}
   */
  getEvidence() {
    return this.evidence;
  }

  /**
   * @param proto
   * @returns {GetConsensusParamsResponse}
   */
  static createFromProto(proto) {
    const protoBlock = proto.getBlock();
    const protoEvidence = proto.getEvidence();

    if (!protoBlock && !protoEvidence) {
      throw new InvalidResponseError('Consensus params are not defined');
    }

    const block = {
      maxBytes: protoBlock.getMaxBytes(),
      maxGas: protoBlock.getMaxGas(),
      timeIotaMs: protoBlock.getTimeIotaMs(),
    };

    const evidence = {
      maxAgeNumBlocks: protoEvidence.getMaxAgeNumBlocks(),
      maxAgeDuration: protoEvidence.getMaxAgeDuration(),
      maxBytes: protoEvidence.getMaxBytes(),
    };

    return new GetConsensusParamsResponse(
      block,
      evidence,
    );
  }
}

module.exports = GetConsensusParamsResponse;
