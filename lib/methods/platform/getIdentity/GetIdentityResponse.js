const AbstractResponse = require('../response/AbstractResponse');
const Metadata = require('../response/Metadata');
const InvalidResponseError = require('../response/errors/InvalidResponseError');

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
    const identity = proto.getIdentity();

    if (identity === undefined) {
      throw new InvalidResponseError('Identity is not defined');
    }

    const metadata = proto.getMetadata() ? new Metadata(proto.getMetadata().toObject()) : undefined;

    return new GetIdentityResponse(
      Buffer.from(identity),
      metadata,
    );
  }
}

module.exports = GetIdentityResponse;
