const AbstractResponse = require('../response/AbstractResponse');
const Metadata = require('../response/Metadata');

class GetDocumentsResponse extends AbstractResponse {
  /**
   * @param {Metadata} metadata
   * @param {Buffer[]} documents
   */
  constructor(metadata, documents) {
    super(metadata);

    this.documents = documents;
  }

  /**
   * @returns {Buffer[]}
   */
  getDocuments() {
    return this.documents;
  }

  /**
   * @param proto
   * @returns {GetDocumentsResponse}
   */
  static createFromProto(proto) {
    return new GetDocumentsResponse(
      new Metadata(proto.getMetadata().toObject()),
      proto.getDocumentsList().map((document) => Buffer.from(document)),
    );
  }
}

module.exports = GetDocumentsResponse;
