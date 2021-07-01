const AbstractResponse = require('../response/AbstractResponse');
const Metadata = require('../response/Metadata');
const InvalidResponseError = require('../response/errors/InvalidResponseError');

class GetIdentitiesByPublicKeyHashesResponse extends AbstractResponse {
  /**
   * @param {Buffer[]} identities
   * @param {Metadata} [metadata]
   */
  constructor(identities, metadata = undefined) {
    super(metadata);

    this.identities = identities;
  }

  /**
   * @returns {Buffer[]}
   */
  getIdentities() {
    return this.identities;
  }

  /**
   * @param proto
   * @returns {GetIdentitiesByPublicKeyHashesResponse}
   */
  static createFromProto(proto) {
    const identitiesList = proto.getIdentitiesList();

    if (identitiesList === undefined) {
      throw new InvalidResponseError('IdentitiesList is not defined');
    }

    const metadata = proto.getMetadata() ? new Metadata(proto.getMetadata().toObject()) : undefined;

    return new GetIdentitiesByPublicKeyHashesResponse(
      identitiesList
        .map((identity) => (identity.length > 0 ? Buffer.from(identity) : null)),
      metadata,
    );
  }
}

module.exports = GetIdentitiesByPublicKeyHashesResponse;
