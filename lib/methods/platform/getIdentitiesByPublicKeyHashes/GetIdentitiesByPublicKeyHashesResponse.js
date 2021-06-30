const AbstractResponse = require('../response/AbstractResponse');
const Metadata = require('../response/Metadata');

class GetIdentitiesByPublicKeyHashesResponse extends AbstractResponse {
  /**
   * @param {Metadata} metadata
   * @param {Buffer[]} identities
   */
  constructor(metadata, identities) {
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
    const metadata = proto.getMetadata() ? new Metadata(proto.getMetadata().toObject()) : null;

    return new GetIdentitiesByPublicKeyHashesResponse(
      metadata,
      proto.getIdentitiesList()
        .map((identity) => (identity.length > 0 ? Buffer.from(identity) : null)),
    );
  }
}

module.exports = GetIdentitiesByPublicKeyHashesResponse;
