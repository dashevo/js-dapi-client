const AbstractResponse = require('../response/AbstractResponse');
const Metadata = require('../response/Metadata');
const InvalidResponseError = require('../response/errors/InvalidResponseError');
const createProofFromRawProof = require('../response/createProofFromRawProof');

class GetIdentityIdsByPublicKeyHashesResponse extends AbstractResponse {
  /**
   * @param {Buffer[]} identityIds
   * @param {Metadata} metadata
   * @param {Proof} [proof]
   */
  constructor(identityIds, metadata, proof = undefined) {
    super(metadata, proof);

    this.identityIds = identityIds;
  }

  /**
   * @returns {Buffer[]}
   */
  getIdentityIds() {
    return this.identityIds;
  }

  /**
   * @param proto
   * @returns {GetIdentityIdsByPublicKeyHashesResponse}
   */
  static createFromProto(proto) {
    const metadata = proto.getMetadata();

    if (metadata === undefined) {
      throw new InvalidResponseError('Metadata is not defined');
    }

    const rawProof = proto.getProof();

    let proof;
    if (rawProof) {
      proof = createProofFromRawProof(rawProof);
    }

    return new GetIdentityIdsByPublicKeyHashesResponse(
      proto.getIdentityIdsList()
        .map((identityId) => (identityId.length > 0 ? Buffer.from(identityId) : null)),
      new Metadata(metadata.toObject()),
      proof,
    );
  }
}

module.exports = GetIdentityIdsByPublicKeyHashesResponse;
