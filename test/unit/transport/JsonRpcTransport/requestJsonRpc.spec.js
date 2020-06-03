const axios = require('axios');
const requestJsonRpc = require('../../../../lib/transport/JsonRpcTransport/requestJsonRpc');
const JsonRpcError = require('../../../../lib/transport/JsonRpcTransport/errors/JsonRpcError');

describe('requestJsonRpc', () => {
  let host;
  let port;
  let timeout;
  let params;

  beforeEach(function beforeEach() {
    host = 'localhost';
    port = 80;
    params = { data: 'test' };
    timeout = 1000;

    const options = { timeout };

    const url = `http://${host}:${port}`;
    const payload = {
      jsonrpc: '2.0',
      params,
      id: 1,
    };

    const axiosStub = this.sinon.stub(axios, 'post');

    axiosStub
      .withArgs(
        url,
        { ...payload, method: 'shouldPass' },
        options,
      )
      .resolves({ status: 200, data: { result: 'passed', error: null } });

    axiosStub
      .withArgs(
        url,
        { ...payload, method: 'wrongData' },
        options,
      )
      .resolves({ status: 400, data: { result: null, error: { message: 'Wrong data' } }, statusMessage: 'Status message' });

    axiosStub
      .withArgs(
        url,
        { ...payload, method: 'invalidData' },
        options,
      )
      .resolves({ status: 200, data: { result: null, error: { message: 'invalid data' } } });

    axiosStub
      .withArgs(
        url,
        { ...payload, method: 'errorData' },
        options,
      )
      .resolves({ status: 200, data: { result: null, error: { message: 'Invalid data for error.data', data: 'additional data here', code: -1 } } });
  });

  afterEach(() => {
    axios.post.restore();
  });

  it('should make rpc request and return result ', async () => {
    const result = await requestJsonRpc(
      host,
      port,
      'shouldPass',
      params,
      { timeout },
    );

    expect(result).to.equal('passed');
  });

  it('should throw error if response status is not 200', async () => {
    try {
      await requestJsonRpc(
        host,
        port,
        'wrongData',
        params,
        { timeout },
      );

      expect.fail('should throw error');
    } catch (e) {
      expect(e.message).to.equal('Status message');
    }
  });

  it('should throw error if there is an error object in the response body', async () => {
    try {
      await requestJsonRpc(
        host,
        port,
        'invalidData',
        params,
        { timeout },
      );

      expect.fail('should throw error');
    } catch (e) {
      expect(e.message).to.equal('DAPI JSON RPC error: invalidData - invalid data');
      expect(e.getData()).to.equal(undefined);
    }
  });

  it('should throw error if there is an error object with data in the response body', async () => {
    const method = 'errorData';
    const options = { timeout };

    try {
      await requestJsonRpc(
        host,
        port,
        method,
        params,
        options,
      );

      expect.fail('should throw error');
    } catch (e) {
      expect(e).to.be.an.instanceof(JsonRpcError);
      expect(e.message).to.equal('DAPI JSON RPC error: errorData - Invalid data for error.data');
      expect(e.getRequestInfo()).to.deep.equal({
        host,
        port,
        method,
        params,
        options,
      });
      expect(e.getErrorMessage()).to.equal('Invalid data for error.data');
      expect(e.getErrorData()).to.equal('additional data here');
      expect(e.getErrorCode()).to.equal(-1);
    }
  });
});
