const GrpcErrorCodes = require('@dashevo/grpc-common/lib/server/error/GrpcErrorCodes');

const GrpcTransport = require('../../../lib/transport/GrpcTransport');
const DAPIAddress = require('../../../lib/dapiAddressProvider/DAPIAddress');

const MaxRetriesReachedError = require('../../../lib/transport/errors/MaxRetriesReachedError');
const NoAvailableAddressesForRetryError = require('../../../lib/transport/errors/NoAvailableAddressesForRetryError');
const NoAvailableAddressesError = require('../../../lib/transport/errors/NoAvailableAddressesError');
const NotFoundError = require('../../../lib/methods/errors/NotFoundError');
const ResponseError = require('../../../lib/methods/errors/ResponseError');

describe('GrpcTransport', () => {
  let grpcTransport;
  let dapiAddressProviderMock;
  let globalOptions;
  let createDAPIAddressProviderFromOptionsMock;
  let dapiAddress;
  let host;
  let url;

  beforeEach(function beforeEach() {
    host = '127.0.0.1';
    dapiAddress = new DAPIAddress(host);

    dapiAddressProviderMock = {
      getLiveAddress: this.sinon.stub().resolves(dapiAddress),
      hasLiveAddresses: this.sinon.stub().resolves(false),
    };

    globalOptions = {
      retries: 0,
    };

    createDAPIAddressProviderFromOptionsMock = this.sinon.stub().returns(null);

    grpcTransport = new GrpcTransport(
      createDAPIAddressProviderFromOptionsMock,
      dapiAddressProviderMock,
      globalOptions,
    );

    // noinspection JSUnresolvedFunction
    url = grpcTransport.makeGrpcUrlFromAddress(dapiAddress);
  });

  describe('#request', () => {
    let method;
    let clientClassMock;
    let requestMessage;
    let options;
    let data;
    let requestFunc;
    let clock;

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

      dapiAddressProviderMock.hasLiveAddresses.resolves(true);

      globalOptions = {
        retries: 1,
      };

      grpcTransport = new GrpcTransport(
        createDAPIAddressProviderFromOptionsMock,
        dapiAddressProviderMock,
        globalOptions,
      );
    });

    afterEach(() => {
      if (clock) {
        clock.restore();
      }
    });

    describe('#request', () => {
      it('should make a request', async () => {
        const receivedData = await grpcTransport.request(
          clientClassMock,
          method,
          requestMessage,
          options,
        );

        expect(receivedData).to.equal(data);
        expect(createDAPIAddressProviderFromOptionsMock).to.be.calledOnceWithExactly(options);
        expect(clientClassMock).to.be.calledOnceWithExactly(url);
        expect(requestFunc).to.be.calledOnceWithExactly(requestMessage, {}, {});
        expect(grpcTransport.lastUsedAddress).to.deep.equal(dapiAddress);
      });

      it('should make a request with `deadline` option if `timeout` option is set', async function itContainer() {
        // Freeze time by using fake timers
        clock = this.sinon.useFakeTimers();

        const timeout = 2000;

        const deadline = new Date();
        deadline.setMilliseconds((new Date()).getMilliseconds() + timeout);

        const receivedData = await grpcTransport.request(
          clientClassMock,
          method,
          requestMessage,
          {
            timeout,
            ...options,
          },
        );

        expect(receivedData).to.equal(data);
        expect(createDAPIAddressProviderFromOptionsMock).to.be.calledOnceWithExactly({
          timeout,
          ...options,
        });
        expect(clientClassMock).to.be.calledOnceWithExactly(url);
        expect(requestFunc).to.be.calledOnceWithExactly(
          requestMessage, {}, {
            deadline,
          },
        );
        expect(grpcTransport.lastUsedAddress).to.deep.equal(dapiAddress);
      });

      it('should throw unknown error if it happened during the request', async () => {
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
          expect(createDAPIAddressProviderFromOptionsMock).to.be.calledOnceWithExactly(options);
          expect(clientClassMock).to.be.calledOnceWithExactly(url);
          expect(requestFunc).to.be.calledOnceWithExactly(requestMessage, {}, {});
        }
      });

      it('should throw NoAvailableAddressesError if there is no available addresses', async () => {
        dapiAddressProviderMock.getLiveAddress.resolves(null);

        try {
          await grpcTransport.request(
            clientClassMock,
            method,
            requestMessage,
            options,
          );

          expect.fail('should throw NoAvailableAddressesError');
        } catch (e) {
          expect(e).to.be.an.instanceof(NoAvailableAddressesError);
          expect(clientClassMock).to.not.be.called();
        }
      });

      it('should throw MaxRetriesReachedError if there are no more retries left', async () => {
        const error = new Error('Internal error');
        error.code = GrpcErrorCodes.DEADLINE_EXCEEDED;
        error.metadata = {
          data: 'additional data',
        };

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
          expect(e.getCode()).to.equal(error.code);
          expect(e.getMetadata()).to.deep.equal(error.metadata);
          expect(e.getDapiAddress()).to.equal('127.0.0.1:3000:3010');
          expect(createDAPIAddressProviderFromOptionsMock).to.be.calledOnceWithExactly(options);
          expect(clientClassMock).to.be.calledOnceWithExactly(url);
          expect(requestFunc).to.be.calledOnceWithExactly(requestMessage, {}, {});
        }
      });

      it('should throw NoAvailableAddressesForRetryError if there are no more available addresses to request', async () => {
        dapiAddressProviderMock.hasLiveAddresses.resolves(false);

        globalOptions = {
          retries: 1,
        };

        grpcTransport = new GrpcTransport(
          createDAPIAddressProviderFromOptionsMock,
          dapiAddressProviderMock,
          globalOptions,
        );

        const error = new Error('Internal error');
        error.code = GrpcErrorCodes.UNAVAILABLE;
        error.metadata = {
          data: 'additional data',
        };

        requestFunc.throws(error);

        try {
          await grpcTransport.request(
            clientClassMock,
            method,
            requestMessage,
            options,
          );

          expect.fail('should throw NoAvailableAddressesForRetryError');
        } catch (e) {
          expect(e).to.be.an.instanceof(NoAvailableAddressesForRetryError);
          expect(e.getCode()).to.equal(error.code);
          expect(e.getMetadata()).to.deep.equal(error.metadata);
          expect(e.getDapiAddress()).to.equal('127.0.0.1:3000:3010');
          expect(createDAPIAddressProviderFromOptionsMock).to.be.calledOnceWithExactly(options);
          expect(clientClassMock).to.be.calledOnceWithExactly(url);
          expect(requestFunc).to.be.calledOnceWithExactly(requestMessage, {}, {});
        }
      });

      it('should throw NotFoundError if error code is NOT_FOUND', async () => {
        dapiAddressProviderMock.hasLiveAddresses.resolves(false);

        globalOptions = {
          retries: 1,
        };

        grpcTransport = new GrpcTransport(
          createDAPIAddressProviderFromOptionsMock,
          dapiAddressProviderMock,
          globalOptions,
        );

        const error = new Error('Internal error');
        error.code = GrpcErrorCodes.NOT_FOUND;
        error.metadata = {
          data: 'additional data',
        };

        requestFunc.throws(error);

        try {
          await grpcTransport.request(
            clientClassMock,
            method,
            requestMessage,
            options,
          );

          expect.fail('should throw NotFoundError');
        } catch (e) {
          expect(e).to.be.an.instanceof(NotFoundError);
          expect(e.getMetadata()).to.deep.equal(error.metadata);
          expect(e.getDapiAddress()).to.equal('127.0.0.1:3000:3010');
          expect(createDAPIAddressProviderFromOptionsMock).to.be.calledOnceWithExactly(options);
          expect(clientClassMock).to.be.calledOnceWithExactly(url);
          expect(requestFunc).to.be.calledOnceWithExactly(requestMessage, {}, {});
        }
      });

      it('should throw ResponseError', async () => {
        dapiAddressProviderMock.hasLiveAddresses.resolves(false);

        globalOptions = {
          retries: 1,
        };

        grpcTransport = new GrpcTransport(
          createDAPIAddressProviderFromOptionsMock,
          dapiAddressProviderMock,
          globalOptions,
        );

        const error = new Error('Internal error');
        error.code = GrpcErrorCodes.OUT_OF_RANGE;
        error.metadata = {
          data: 'additional data',
        };

        requestFunc.throws(error);

        try {
          await grpcTransport.request(
            clientClassMock,
            method,
            requestMessage,
            options,
          );

          expect.fail('should throw NotFoundError');
        } catch (e) {
          expect(e).to.be.an.instanceof(ResponseError);
          expect(e.getMetadata()).to.deep.equal(error.metadata);
          expect(e.getCode()).to.equal(error.code);
          expect(e.getDapiAddress()).to.equal('127.0.0.1:3000:3010');
          expect(createDAPIAddressProviderFromOptionsMock).to.be.calledOnceWithExactly(options);
          expect(clientClassMock).to.be.calledOnceWithExactly(url);
          expect(requestFunc).to.be.calledOnceWithExactly(requestMessage, {}, {});
        }
      });

      it('should throw ResponseError on throwDeadlineExceeded option', async () => {
        dapiAddressProviderMock.hasLiveAddresses.resolves(false);

        globalOptions = {
          retries: 1,
        };

        options.throwDeadlineExceeded = true;

        grpcTransport = new GrpcTransport(
          createDAPIAddressProviderFromOptionsMock,
          dapiAddressProviderMock,
          globalOptions,
        );

        const error = new Error('Internal error');
        error.code = GrpcErrorCodes.DEADLINE_EXCEEDED;
        error.metadata = {
          data: 'additional data',
        };

        requestFunc.throws(error);

        try {
          await grpcTransport.request(
            clientClassMock,
            method,
            requestMessage,
            options,
          );

          expect.fail('should throw NotFoundError');
        } catch (e) {
          expect(e).to.be.an.instanceof(ResponseError);
          expect(e.getMetadata()).to.deep.equal(error.metadata);
          expect(e.getCode()).to.equal(error.code);
          expect(e.getDapiAddress()).to.equal('127.0.0.1:3000:3010');
          expect(createDAPIAddressProviderFromOptionsMock).to.be.calledOnceWithExactly(options);
          expect(clientClassMock).to.be.calledOnceWithExactly(url);
          expect(requestFunc).to.be.calledOnceWithExactly(requestMessage, {}, {});
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
        expect(createDAPIAddressProviderFromOptionsMock).to.be.calledTwice();
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
        expect(createDAPIAddressProviderFromOptionsMock).to.be.calledTwice();
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
        expect(createDAPIAddressProviderFromOptionsMock).to.be.calledTwice();
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
        expect(createDAPIAddressProviderFromOptionsMock).to.be.calledTwice();
        expect(clientClassMock).to.be.calledTwice();
        expect(requestFunc).to.be.calledTwice();
      });

      it('should retry the request if a unimplemented error has thrown', async () => {
        const error = new Error('Internal error');
        error.code = GrpcErrorCodes.UNIMPLEMENTED;

        requestFunc.onCall(0).throws(error);

        const receivedData = await grpcTransport.request(
          clientClassMock,
          method,
          requestMessage,
          options,
        );

        expect(receivedData).to.deep.equal(data);
        expect(createDAPIAddressProviderFromOptionsMock).to.be.calledTwice();
        expect(clientClassMock).to.be.calledTwice();
        expect(requestFunc).to.be.calledTwice();
      });

      it('should retry the request if a GRPC unknown error has thrown', async () => {
        const error = new Error('Internal error');
        error.code = GrpcErrorCodes.UNKNOWN;

        requestFunc.onCall(0).throws(error);

        const receivedData = await grpcTransport.request(
          clientClassMock,
          method,
          requestMessage,
          options,
        );

        expect(receivedData).to.deep.equal(data);
        expect(createDAPIAddressProviderFromOptionsMock).to.be.calledTwice();
        expect(clientClassMock).to.be.calledTwice();
        expect(requestFunc).to.be.calledTwice();
      });
    });

    describe('#getLastUsedAddress', () => {
      it('should return last used address', async () => {
        await grpcTransport.request(
          clientClassMock,
          method,
          requestMessage,
        );

        const getLastUsedAddress = grpcTransport.getLastUsedAddress();
        expect(getLastUsedAddress).to.deep.equal(grpcTransport.lastUsedAddress);
      });
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

      it('should make a request in web environment', async () => {
        const receivedData = await grpcTransport.request(
          clientClassMock,
          method,
          requestMessage,
          options,
        );

        expect(receivedData).to.deep.equal(data);
        expect(createDAPIAddressProviderFromOptionsMock).to.be.calledOnceWithExactly(options);
        expect(clientClassMock).to.be.calledOnceWithExactly(`http://${host}:${dapiAddress.getHttpPort()}`);
        expect(requestFunc).to.be.calledOnceWithExactly(requestMessage, {}, {});
        expect(grpcTransport.lastUsedAddress).to.deep.equal(dapiAddress);
      });

      it('should make a https request in web environment', async () => {
        dapiAddress = new DAPIAddress({
          host,
          httpPort: 443,
        });

        dapiAddressProviderMock.getLiveAddress.resolves(dapiAddress);

        grpcTransport = new GrpcTransport(
          createDAPIAddressProviderFromOptionsMock,
          dapiAddressProviderMock,
          globalOptions,
        );

        const receivedData = await grpcTransport.request(
          clientClassMock,
          method,
          requestMessage,
          options,
        );

        expect(receivedData).to.deep.equal(data);
        expect(createDAPIAddressProviderFromOptionsMock).to.be.calledOnceWithExactly(options);
        expect(clientClassMock).to.be.calledOnceWithExactly(`https://${host}:${dapiAddress.getHttpPort()}`);
        expect(requestFunc).to.be.calledOnceWithExactly(requestMessage, {}, {});
        expect(grpcTransport.lastUsedAddress).to.deep.equal(dapiAddress);
      });
    });
  });
});
