const AbstractResponse = require('../response/AbstractResponse');
const Metadata = require('../response/Metadata');

class GetIdentityIdsByPublicKeyHashesResponse extends AbstractResponse {
  /**
   * @param {Buffer[]} identityIds
   * @param {Metadata} metadata
   */
  constructor(identityIds, metadata = undefined) {
    super(metadata);

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
    const metadata = proto.getMetadata() ? new Metadata(proto.getMetadata().toObject()) : undefined;

    return new GetIdentityIdsByPublicKeyHashesResponse(
      proto.getIdentityIdsList()
        .map((identityId) => (identityId.length > 0 ? Buffer.from(identityId) : null)),
      metadata,
    );
  }
}

module.exports = GetIdentityIdsByPublicKeyHashesResponse;
