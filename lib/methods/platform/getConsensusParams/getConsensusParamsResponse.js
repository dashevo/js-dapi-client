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

    const maxBytes = block.getMaxBytes();
    const maxGas = block.getMaxGas();
    const timeIotaMs = block.getTimeIotaMs();

    const maxAge = evidence.getMaxAge();

    const consensusParams = {
      block: {
        maxBytes,
        maxGas,
        timeIotaMs,
      },
      evidence: {
        maxAge,
      },
    };

    return new GetConsensusParamsResponse(
      consensusParams,
    );
  }
}

module.exports = GetConsensusParamsResponse;
