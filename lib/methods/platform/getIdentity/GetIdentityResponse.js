const AbstractResponse = require('../response/AbstractResponse');

class GetIdentityResponse extends AbstractResponse {
  /**
   * @param {Metadata} metadata
   * @param {Buffer} [identity]
   */
  constructor(metadata, identity = undefined) {
    super(metadata);

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
    return new GetIdentityResponse(
      proto.getMetadata().toObject(),
      proto.getIdentity() ? Buffer.from(proto.getIdentity()) : undefined,
    );
  }
}

module.exports = GetIdentityResponse;
