const AbstractResponse = require('../response/AbstractResponse');
const Metadata = require('../response/Metadata');

class GetDocumentsResponse extends AbstractResponse {
  /**
   * @param {Buffer[]} documents
   * @param {Metadata} metadata
   */
  constructor(documents, metadata = undefined) {
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
    const metadata = proto.getMetadata() ? new Metadata(proto.getMetadata().toObject()) : undefined;

    return new GetDocumentsResponse(
      proto.getDocumentsList().map((document) => Buffer.from(document)),
      metadata,
    );
  }
}

module.exports = GetDocumentsResponse;
