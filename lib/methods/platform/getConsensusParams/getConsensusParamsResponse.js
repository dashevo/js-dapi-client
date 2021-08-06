const InvalidResponseError = require('../response/errors/InvalidResponseError');

class GetConsensusParamsResponse {
  /**
   *
   * @param {object} consensusParams
   */
  constructor(consensusParams) {
    this.consensusParams = consensusParams;
  }

  /**
   * @returns {object}
   */
  getConsensusParams() {
    return this.consensusParams;
  }

  /**
   * @param proto
   * @returns {GetConsensusParamsResponse}
   */
  static createFromProto(proto) {
    const block = proto.getBlock();
    const evidence = proto.getEvidence();

    if (!block && !evidence) {
      throw new InvalidResponseError('Consensus params are not defined');
    }

    const consensusParams = {
      block: {
        maxBytes: block.getMaxBytes(),
        maxGas: block.getMaxGas(),
        timeIotaMs: block.getTimeIotaMs(),
      },
      evidence: {
        maxAgeNumBlocks: evidence.getMaxAgeNumBlocks(),
        maxAgeDuration: evidence.getMaxAgeDuration(),
        maxBytes: evidence.getMaxBytes(),
      },
    };

    return new GetConsensusParamsResponse(
      consensusParams,
    );
  }
}

module.exports = GetConsensusParamsResponse;
