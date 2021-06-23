const AbstractResponse = require('../response/AbstractResponse');
const Metadata = require('../response/Metadata');

class WaitForStateTransitionResultResponse extends AbstractResponse {
  /**
   * @param {Metadata} metadata
   * @param {Buffer} identity
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
   * @returns {WaitForStateTransitionResultResponse}
   */
  static createFromProto(proto) {
    return new WaitForStateTransitionResultResponse(
      new Metadata(proto.getMetadata().toObject()),
      proto.getError() ? Buffer.from(proto.getIdentity()) : undefined,
    );
  }
}

module.exports = WaitForStateTransitionResultResponse;
