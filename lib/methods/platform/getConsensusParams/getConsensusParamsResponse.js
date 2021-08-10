const InvalidResponseError = require('../response/errors/InvalidResponseError');

class GetConsensusParamsResponse {
  /**
   *
   * @param {Object} block
   * @param {Object} evidence
   */
  constructor(block, evidence) {
    this.block = block;
    this.evidence = evidence;
  }

  /**
   * @returns {Object}
   */
  getBlock() {
    return this.block;
  }

  /**
   * @returns {Object}
   */
  getEvidence() {
    return this.evidence;
  }

  /**
   * @param proto
   * @returns {GetConsensusParamsResponse}
   */
  static createFromProto(proto) {
    const rawBlock = proto.getBlock();
    const rawEvidence = proto.getEvidence();

    if (!rawBlock && !rawEvidence) {
      throw new InvalidResponseError('Consensus params are not defined');
    }

    const block = {
      maxBytes: rawBlock.getMaxBytes(),
      maxGas: rawBlock.getMaxGas(),
      timeIotaMs: rawBlock.getTimeIotaMs(),
    };

    const evidence = {
      maxAgeNumBlocks: rawEvidence.getMaxAgeNumBlocks(),
      maxAgeDuration: rawEvidence.getMaxAgeDuration(),
      maxBytes: rawEvidence.getMaxBytes(),
    };

    return new GetConsensusParamsResponse(
      block,
      evidence,
    );
  }
}

module.exports = GetConsensusParamsResponse;
