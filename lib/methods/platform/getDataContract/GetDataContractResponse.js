const AbstractResponse = require('../response/AbstractResponse');
const Metadata = require('../response/Metadata');
const InvalidResponseError = require('../response/errors/InvalidResponseError');
const Proof = require('../response/Proof');
const StoreTreeProofs = require('../response/StoreTreeProofs');

class GetDataContractResponse extends AbstractResponse {
  /**
   * @param {Buffer} dataContract
   * @param {Metadata} metadata
   * @param {Proof} [proof]
   */
  constructor(dataContract, metadata, proof = undefined) {
    super(metadata, proof);

    this.dataContract = dataContract;
  }

  /**
   * @returns {Buffer}
   */
  getDataContract() {
    return this.dataContract;
  }

  /**
   * @param proto
   * @returns {GetDataContractResponse}
   */
  static createFromProto(proto) {
    const dataContract = proto.getDataContract();
    const rawProof = proto.getProof();

    if (!dataContract && !rawProof) {
      throw new InvalidResponseError('DataContract is not defined');
    }

    const metadata = proto.getMetadata();

    if (metadata === undefined) {
      throw new InvalidResponseError('Metadata is not defined');
    }

    let proof;
    if (rawProof) {
      proof = new Proof({
        rootTreeProof: Buffer.from(rawProof.getRootTreeProof()),
        storeTreeProofs: new StoreTreeProofs({
          dataContractsProof: Buffer.from(rawProof.getStoreTreeProofs().getDataContractsProof()),
          publicKeyHashesToIdentityIdsProof:
            Buffer.from(rawProof.getStoreTreeProofs().getPublicKeyHashesToIdentityIdsProof()),
          identitiesProof: Buffer.from(rawProof.getStoreTreeProofs().getIdentitiesProof()),
          documentsProof: Buffer.from(rawProof.getStoreTreeProofs().getDocumentsProof()),
        }),
        signatureLLMQHash: Buffer.from(rawProof.getSignatureLlmqHash()),
        signature: Buffer.from(rawProof.getSignature()),
      });
    }

    return new GetDataContractResponse(
      Buffer.from(dataContract),
      new Metadata(metadata.toObject()),
      proof,
    );
  }
}

module.exports = GetDataContractResponse;
