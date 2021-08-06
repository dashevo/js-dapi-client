const AbstractResponse = require('../response/AbstractResponse');
const Metadata = require('../response/Metadata');
const InvalidResponseError = require('../response/errors/InvalidResponseError');
const Proof = require('../response/Proof');
const StoreTreeProofs = require('../response/StoreTreeProofs');

class GetIdentityResponse extends AbstractResponse {
  /**
   * @param {Buffer} identity
   * @param {Metadata} metadata
   * @param {Proof} [proof]
   */
  constructor(identity, metadata, proof = undefined) {
    super(metadata, proof);

    this.identity = identity;
  }

  /**
   * @returns {Buffer}
   */
  getIdentity() {
    return this.identity;
  }

  /**
   * @param proto
   * @returns {GetIdentityResponse}
   */
  static createFromProto(proto) {
    const identity = proto.getIdentity();
    const rawProof = proto.getProof();

    if (!identity && !rawProof) {
      throw new InvalidResponseError('Identity is not defined');
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

    return new GetIdentityResponse(
      Buffer.from(proto.getIdentity()),
      new Metadata(metadata.toObject()),
      proof,
    );
  }
}

module.exports = GetIdentityResponse;
