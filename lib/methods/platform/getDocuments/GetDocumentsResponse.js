const AbstractResponse = require('../response/AbstractResponse');
const Metadata = require('../response/Metadata');
const InvalidResponseError = require('../response/errors/InvalidResponseError');
const Proof = require('../response/Proof');
const StoreTreeProofs = require('../response/StoreTreeProofs');

class GetDocumentsResponse extends AbstractResponse {
  /**
   * @param {Buffer[]} documents
   * @param {Metadata} metadata
   * @param {Proof} [proof]
   */
  constructor(documents, metadata, proof = undefined) {
    super(metadata, proof);

    this.documents = documents;
  }

  /**
   * @returns {Buffer[]}
   */
  getDocuments() {
    return this.documents;
  }

  /**
   * @param proto
   * @returns {GetDocumentsResponse}
   */
  static createFromProto(proto) {
    const metadata = proto.getMetadata();

    if (metadata === undefined) {
      throw new InvalidResponseError('Metadata is not defined');
    }

    const rawProof = proto.getProof();

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

    return new GetDocumentsResponse(
      proto.getDocumentsList().map((document) => Buffer.from(document)),
      new Metadata(metadata.toObject()),
      proof,
    );
  }
}

module.exports = GetDocumentsResponse;
