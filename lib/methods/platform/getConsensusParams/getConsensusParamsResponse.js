const AbstractResponse = require('../response/AbstractResponse');
const InvalidResponseError = require('../response/errors/InvalidResponseError');
const Proof = require('../response/Proof');
const Metadata = require('../response/Metadata');

class GetConsensusParamsResponse extends AbstractResponse {
  /**
   *
   * @param {Object} consensusParams
   * @param {Metadata} metadata
   * @param {Proof} [proof]
   */
  constructor(consensusParams, metadata, proof = undefined) {
    super(metadata, proof);

    this.consensusParams = consensusParams;
  }

  /**
   * @returns {Object}
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
    const rawProof = proto.getProof();

    if (!block && !evidence && !rawProof) {
      throw new InvalidResponseError('Consensus params are not defined');
    }

    const metadata = proto.getMetadata();

    if (metadata === undefined) {
      throw new InvalidResponseError('Metadata is not defined');
    }

    let proof;
    if (rawProof) {
      proof = new Proof({
        rootTreeProof: Buffer.from(rawProof.getRootTreeProof()),
        storeTreeProof: Buffer.from(rawProof.getStoreTreeProof()),
        signatureLLMQHash: Buffer.from(rawProof.getSignatureLlmqHash()),
        signature: Buffer.from(rawProof.getSignature()),
      });
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
      new Metadata(metadata.toObject()),
      proof,
    );
  }
}

module.exports = GetConsensusParamsResponse;
