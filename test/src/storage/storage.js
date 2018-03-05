const sinon = require('sinon');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const Storage = require('../../../src/storage');

const fs = require('graceful-fs');

chai.use(chaiAsPromised);
const { expect } = chai;
let fsData = {};

describe('Storage', async () => {

  before(() => {
    writeStub = sinon.stub(fs, 'writeFile');
    writeStub.callsFake((path, data, callback) => {
      fsData[path] = data;
      callback(null);
    });
    readStub = sinon.stub(fs, 'readFile');
    readStub.callsFake((path, callback) => {
      callback(null, fsData[path]);
    });
  });

  after(() => {
    fs.writeFile.restore();
    fs.readFile.restore();
  });

  describe('.getCollection', () => {
    it('Should create collection if it does\'nt exists', async () => {

    });
    it('', async () => {

    });
    it('', async () => {

    });
  });

  it('Should be able to save data and then retrieve it', async() => {
    const storage = new Storage();
    await storage.put('blocks', { 'height': 1 });
    await storage.put('blocks', { 'height': 2 });
    const block = storage.find('blocks', {height: 1});
  });

});