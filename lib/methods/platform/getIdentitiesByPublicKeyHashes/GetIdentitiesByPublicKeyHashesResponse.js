const AbstractResponse = require('../response/AbstractResponse');

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
    return new GetIdentitiesByPublicKeyHashesResponse(
      proto.getMetadata().toObject(),
      proto.getIdentitiesList()
        .map((identity) => (identity.length > 0 ? Buffer.from(identity) : null)),
    );
  }
}

module.exports = GetIdentitiesByPublicKeyHashesResponse;
