const GrpcErrorCodes = require('@dashevo/grpc-common/lib/server/error/GrpcErrorCodes');

const GrpcTransport = require('../../../lib/transport/GrpcTransport');
const DAPIAddress = require('../../../lib/addressProvider/DAPIAddress');

const MaxRetriesReachedError = require('../../../lib/transport/errors/MaxRetriesReachedError');
const NoAvailableAddressesForRetry = require('../../../lib/transport/errors/NoAvailableAddressesForRetry');

describe('GrpcTransport', () => {
  let grpcTransport;
  let addressProviderMock;
  let globalOptions;
  let createDAPIAddressProviderFromOptionsMock;
  let dapiAddress;
  let host;
  let url;

  beforeEach(function beforeEach() {
    host = '127.0.0.1';
    dapiAddress = new DAPIAddress(host);
    url = `${host}:${dapiAddress.getGrpcPort()}`;

    addressProviderMock = {
      getAddress: this.sinon.stub().resolves(dapiAddress),
      hasAddresses: this.sinon.stub().resolves(false),
    };

    globalOptions = {
      retries: 0,
    };
    createDAPIAddressProviderFromOptionsMock = this.sinon.stub().returns(null);

    grpcTransport = new GrpcTransport(
      createDAPIAddressProviderFromOptionsMock,
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

      requestFunc = this.sinon.stub().resolves(data)

      clientClassMock = this.sinon.stub().returns({
        [method]: requestFunc,
      });
    });

    it('should make a request', async () => {
      const receivedData = await grpcTransport.request(
        clientClassMock,
        method,
        requestMessage,
        options,
      );

      expect(receivedData).to.deep.equal(data);
      expect(createDAPIAddressProviderFromOptionsMock).to.be.calledOnceWithExactly(options);
      expect(clientClassMock).to.be.calledOnceWithExactly(url);
      expect(requestFunc).to.be.calledOnceWithExactly(requestMessage);
    });

    it('should throw unknown error', async function it() {
      const error = new Error('Internal error');

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
        expect(requestFunc).to.be.calledOnceWithExactly(requestMessage);
      }
    });

    it('should throw MaxRetriesReachedError', async function it() {
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
        expect(createDAPIAddressProviderFromOptionsMock).to.be.calledOnceWithExactly(options);
        expect(clientClassMock).to.be.calledOnceWithExactly(url);
        expect(requestFunc).to.be.calledOnceWithExactly(requestMessage);
      }
    });

    it('should throw NoAvailableAddressesForRetry', async function it() {
      globalOptions = {
        retries: 1,
      };

      grpcTransport = new GrpcTransport(
        createDAPIAddressProviderFromOptionsMock,
        addressProviderMock,
        globalOptions,
      );

      const error = new Error('Internal error');
      error.code = GrpcErrorCodes.UNAVAILABLE;

      requestFunc.throws(error);

      options.retries = 0;
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
        expect(createDAPIAddressProviderFromOptionsMock).to.be.calledOnceWithExactly(options);
        expect(clientClassMock).to.be.calledOnceWithExactly(url);
        expect(requestFunc).to.be.calledOnceWithExactly(requestMessage);
      }
    });

    it('should retry request after fail', async function it() {
      addressProviderMock.hasAddresses.resolves(true);

      globalOptions = {
        retries: 1,
      };

      grpcTransport = new GrpcTransport(
        createDAPIAddressProviderFromOptionsMock,
        addressProviderMock,
        globalOptions,
      );

      const error = new Error('Internal error');
      error.code = GrpcErrorCodes.INTERNAL;

      requestFunc.onCall(0).throws(error);

      options.retries = 0;
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
    it('should return lastUsedAddress', async () => {
      grpcTransport.lastUsedAddress = host;

      const lastUsedAddress = grpcTransport.getLastUsedAddress();

      expect(lastUsedAddress).to.equal(host);
    });
  });

  describe('#makeGrpcUrlFromAddress', () => {
    describe('NodeJS', () => {
      it('should return grpc url from address', async () => {
        const url = await grpcTransport.makeGrpcUrlFromAddress(dapiAddress);

        expect(url).to.equal(`${host}:${dapiAddress.getGrpcPort()}`);
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
      })


      it('should return grpc url from address', async () => {
        const url = await grpcTransport.makeGrpcUrlFromAddress(dapiAddress);

        expect(url).to.equal(`http://${host}:${dapiAddress.getHttpPort()}`);
      });
    });
  });
});
