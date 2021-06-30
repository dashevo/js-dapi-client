const AbstractResponse = require('../response/AbstractResponse');
const Metadata = require('../response/Metadata');

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
    const metadata = proto.getMetadata() ? new Metadata(proto.getMetadata().toObject()) : null;

    return new GetIdentityResponse(
      metadata,
      proto.getIdentity() ? Buffer.from(proto.getIdentity()) : undefined,
    );
  }
}

module.exports = GetIdentityResponse;
