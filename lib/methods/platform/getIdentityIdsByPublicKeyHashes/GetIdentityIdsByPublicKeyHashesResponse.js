const AbstractResponse = require('../response/AbstractResponse');
const Metadata = require('../response/Metadata');

class GetIdentityIdsByPublicKeyHashesResponse extends AbstractResponse {
  /**
   * @param {Metadata} metadata
   * @param {Buffer[]} identityIds
   */
  constructor(metadata, identityIds) {
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
    return new GetIdentityIdsByPublicKeyHashesResponse(
      new Metadata(proto.getMetadata().toObject()),
      proto.getIdentityIdsList()
        .map((identityId) => (identityId.length > 0 ? Buffer.from(identityId) : null)),
    );
  }
}

module.exports = GetIdentityIdsByPublicKeyHashesResponse;
