const AbstractResponse = require('../response/AbstractResponse');
const Metadata = require('../response/Metadata');
const InvalidResponseError = require('../response/errors/InvalidResponseError');

class GetDataContractResponse extends AbstractResponse {
  /**
   * @param {Buffer} dataContract
   * @param {Metadata} [metadata]
   */
  constructor(dataContract, metadata = undefined) {
    super(metadata);

    this.dataContract = dataContract;
  }

  /**
   * @returns {Buffer}
   */
  getDataContract() {
    return this.dataContract;
  }

  /**
   * @param proto
   * @return {GetDataContractResponse}
   */
  static createFromProto(proto) {
    const metadata = proto.getMetadata();

    if (metadata === undefined) {
      throw new InvalidResponseError('Metadata is not defined');
    }

    return new GetDataContractResponse(
      Buffer.from(proto.getDataContract()),
      new Metadata(metadata.toObject()),
    );
  }
}

module.exports = GetDataContractResponse;
