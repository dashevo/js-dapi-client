const AbstractResponse = require('../response/AbstractResponse');
const Metadata = require('../response/Metadata');
const InvalidResponseError = require('../response/errors/InvalidResponseError');

class GetDataContractResponse extends AbstractResponse {
  /**
   * @param {Buffer} [dataContract]
   * @param {Metadata} metadata
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
    const dataContract = proto.getDataContract();

    if (dataContract === undefined) {
      throw new InvalidResponseError();
    }

    const metadata = proto.getMetadata() ? new Metadata(proto.getMetadata().toObject()) : undefined;

    return new GetDataContractResponse(
      Buffer.from(dataContract),
      metadata,
    );
  }
}

module.exports = GetDataContractResponse;
