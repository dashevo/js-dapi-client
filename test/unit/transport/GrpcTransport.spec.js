const GrpcErrorCodes = require('@dashevo/grpc-common/lib/server/error/GrpcErrorCodes');

const GrpcTransport = require('../../../lib/transport/GrpcTransport');
const DAPIAddress = require('../../../lib/addressProvider/DAPIAddress');

const MaxRetriesReachedError = require('../../../lib/transport/errors/MaxRetriesReachedError');
const NoAvailableAddressesForRetry = require('../../../lib/transport/errors/NoAvailableAddressesForRetry');

describe('GrpcTransport', () => {
  let grpcTransport;
  let addressProviderMock;
  let globalOptions;
  let createAddressProviderFromOptionsMock;
  let dapiAddress;
  let host;
  let url;

  beforeEach(function beforeEach() {
    host = '127.0.0.1';
    dapiAddress = new DAPIAddress(host);
    url = `${host}:${dapiAddress.getGrpcPort()}`;

    addressProviderMock = {
      getLiveAddress: this.sinon.stub().resolves(dapiAddress),
      hasLiveAddresses: this.sinon.stub().resolves(false),
    };

    globalOptions = {
      retries: 0,
    };
    createAddressProviderFromOptionsMock = this.sinon.stub().returns(null);

    grpcTransport = new GrpcTransport(
      createAddressProviderFromOptionsMock,
      addressProviderMock,
      globalOptions,
    );
  });

  describe('#request', () => {
    let method;
    let clientClassMock;
    let requestMessage;
    let options;
    let data;
    let requestFunc;

    beforeEach(function beforeEach() {
      data = 'result';
      method = 'method';
      requestMessage = 'requestMessage';
      options = {
        option: 'value',
      };

      requestFunc = this.sinon.stub().resolves(data);

      clientClassMock = this.sinon.stub().returns({
        [method]: requestFunc,
      });

      addressProviderMock.hasLiveAddresses.resolves(true);

      globalOptions = {
        retries: 1,
      };

      grpcTransport = new GrpcTransport(
        createAddressProviderFromOptionsMock,
        addressProviderMock,
        globalOptions,
      );
    });

    it('should make a request', async () => {
      const receivedData = await grpcTransport.request(
        clientClassMock,
        method,
        requestMessage,
        options,
      );

      expect(receivedData).to.equal(data);
      expect(createAddressProviderFromOptionsMock).to.be.calledOnceWithExactly(options);
      expect(clientClassMock).to.be.calledOnceWithExactly(url);
      expect(requestFunc).to.be.calledOnceWithExactly(requestMessage);
      expect(grpcTransport.lastUsedAddress).to.deep.equal(dapiAddress);
    });

    it('should throw unknown error', async () => {
      const error = new Error('Unknown error');

      requestFunc.throws(error);

      try {
        await grpcTransport.request(
          clientClassMock,
          method,
          requestMessage,
          options,
        );

        expect.fail('should throw error');
      } catch (e) {
        expect(e).to.deep.equal(error);
        expect(createAddressProviderFromOptionsMock).to.be.calledOnceWithExactly(options);
        expect(clientClassMock).to.be.calledOnceWithExactly(url);
        expect(requestFunc).to.be.calledOnceWithExactly(requestMessage);
      }
    });

    it('should throw MaxRetriesReachedError', async () => {
      const error = new Error('Internal error');
      error.code = GrpcErrorCodes.DEADLINE_EXCEEDED;

      requestFunc.throws(error);

      options.retries = 0;
      try {
        await grpcTransport.request(
          clientClassMock,
          method,
          requestMessage,
          options,
        );

        expect.fail('should throw MaxRetriesReachedError');
      } catch (e) {
        expect(e).to.be.an.instanceof(MaxRetriesReachedError);
        expect(createAddressProviderFromOptionsMock).to.be.calledOnceWithExactly(options);
        expect(clientClassMock).to.be.calledOnceWithExactly(url);
        expect(requestFunc).to.be.calledOnceWithExactly(requestMessage);
      }
    });

    it('should throw NoAvailableAddressesForRetry error', async () => {
      addressProviderMock.hasLiveAddresses.resolves(false);

      globalOptions = {
        retries: 1,
      };

      grpcTransport = new GrpcTransport(
        createAddressProviderFromOptionsMock,
        addressProviderMock,
        globalOptions,
      );

      const error = new Error('Internal error');
      error.code = GrpcErrorCodes.UNAVAILABLE;

      requestFunc.throws(error);

      try {
        await grpcTransport.request(
          clientClassMock,
          method,
          requestMessage,
          options,
        );

        expect.fail('should throw NoAvailableAddressesForRetry');
      } catch (e) {
        expect(e).to.be.an.instanceof(NoAvailableAddressesForRetry);
        expect(createAddressProviderFromOptionsMock).to.be.calledOnceWithExactly(options);
        expect(clientClassMock).to.be.calledOnceWithExactly(url);
        expect(requestFunc).to.be.calledOnceWithExactly(requestMessage);
      }
    });

    it('should retry the request if an internal error has thrown', async () => {
      const error = new Error('Internal error');
      error.code = GrpcErrorCodes.INTERNAL;

      requestFunc.onCall(0).throws(error);

      const receivedData = await grpcTransport.request(
        clientClassMock,
        method,
        requestMessage,
        options,
      );

      expect(receivedData).to.deep.equal(data);
      expect(createAddressProviderFromOptionsMock).to.be.calledTwice();
      expect(clientClassMock).to.be.calledTwice();
      expect(requestFunc).to.be.calledTwice();
    });

    it('should retry the request if an unavailable error has thrown', async () => {
      const error = new Error('Internal error');
      error.code = GrpcErrorCodes.UNAVAILABLE;

      requestFunc.onCall(0).throws(error);

      const receivedData = await grpcTransport.request(
        clientClassMock,
        method,
        requestMessage,
        options,
      );

      expect(receivedData).to.deep.equal(data);
      expect(createAddressProviderFromOptionsMock).to.be.calledTwice();
      expect(clientClassMock).to.be.calledTwice();
      expect(requestFunc).to.be.calledTwice();
    });

    it('should retry the request if a deadline exceeded error has thrown', async () => {
      const error = new Error('Internal error');
      error.code = GrpcErrorCodes.DEADLINE_EXCEEDED;

      requestFunc.onCall(0).throws(error);

      const receivedData = await grpcTransport.request(
        clientClassMock,
        method,
        requestMessage,
        options,
      );

      expect(receivedData).to.deep.equal(data);
      expect(createAddressProviderFromOptionsMock).to.be.calledTwice();
      expect(clientClassMock).to.be.calledTwice();
      expect(requestFunc).to.be.calledTwice();
    });

    it('should retry the request if a cancelled exceeded error has thrown', async () => {
      const error = new Error('Internal error');
      error.code = GrpcErrorCodes.CANCELLED;

      requestFunc.onCall(0).throws(error);

      const receivedData = await grpcTransport.request(
        clientClassMock,
        method,
        requestMessage,
        options,
      );

      expect(receivedData).to.deep.equal(data);
      expect(createAddressProviderFromOptionsMock).to.be.calledTwice();
      expect(clientClassMock).to.be.calledTwice();
      expect(requestFunc).to.be.calledTwice();
    });

    describe('gRPC-Web', () => {
      let originalVersion;

      before(() => {
        originalVersion = process.versions;
        Object.defineProperty(process, 'versions', {
          value: null,
        });
      });

      after(() => {
        Object.defineProperty(process, 'versions', {
          value: originalVersion,
        });
      });

      it('should return make a request in web environment', async () => {
        const receivedData = await grpcTransport.request(
          clientClassMock,
          method,
          requestMessage,
          options,
        );

        expect(receivedData).to.deep.equal(data);
        expect(createAddressProviderFromOptionsMock).to.be.calledOnceWithExactly(options);
        expect(clientClassMock).to.be.calledOnceWithExactly(`http://${host}:${dapiAddress.getHttpPort()}`);
        expect(requestFunc).to.be.calledOnceWithExactly(requestMessage);
        expect(grpcTransport.lastUsedAddress).to.deep.equal(dapiAddress);
      });
    });
  });
});
