const AbstractResponse = require('../response/AbstractResponse');
const Metadata = require('../response/Metadata');

class GetIdentitiesByPublicKeyHashesResponse extends AbstractResponse {
  /**
   * @param {Buffer[]} identities
   * @param {Metadata} metadata
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
    const metadata = proto.getMetadata() ? new Metadata(proto.getMetadata().toObject()) : undefined;

    return new GetIdentitiesByPublicKeyHashesResponse(
      proto.getIdentitiesList()
        .map((identity) => (identity.length > 0 ? Buffer.from(identity) : null)),
      metadata,
    );
  }
}

module.exports = GetIdentitiesByPublicKeyHashesResponse;
