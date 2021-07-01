const AbstractResponse = require('../response/AbstractResponse');
const Metadata = require('../response/Metadata');

class GetIdentityResponse extends AbstractResponse {
  /**
   * @param {Buffer} [identity]
   * @param {Metadata} metadata
   */
  constructor(identity, metadata = undefined) {
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
    const metadata = proto.getMetadata() ? new Metadata(proto.getMetadata().toObject()) : undefined;

    return new GetIdentityResponse(
      proto.getIdentity() ? Buffer.from(proto.getIdentity()) : undefined,
      metadata,
    );
  }
}

module.exports = GetIdentityResponse;
