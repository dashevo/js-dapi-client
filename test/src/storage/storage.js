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

  beforeEach(() => {
    // Flush simulated fs data before each test
    fsData = {};
  });

  after(() => {
    fs.writeFile.restore();
    fs.readFile.restore();
  });

  describe('.getCollection', () => {
    it('Should create collection if it does\'nt exists', async () => {
      const storage = new Storage();
    });
    it('', async () => {

    });
    it('', async () => {

    });
  });

  it('Should be able to save and retrieve data', async() => {
    const storage = new Storage();

    await storage.insert('blocks', { 'height': 1, 'foo': 'bar' });
    await storage.insert('blocks', { 'height': 2 });
    await storage.insert('blocks', { 'height': 3, 'foo': 'bar' });
    await storage.insert('blocks', { 'height': 4, 'foo': 'bar' });
    await storage.insert('blocks', { 'height': 5 });
    await storage.insert('blocks', { 'height': 6, 'foo': 'bar' });

    let blocks = await storage.findAll('blocks', {});
    expect(blocks.length).to.be.equal(6);

    blocks = await storage.findAll('blocks', {foo: 'bar'});
    expect(blocks).to.be.an('array');
    expect(blocks.length).to.be.equal(4);
    expect(blocks[0].height).to.be.equal(1);
    expect(blocks[0].foo).to.be.equal('bar');
    expect(blocks[1].height).to.be.equal(3);
    expect(blocks[1].foo).to.be.equal('bar');
    expect(blocks[2].height).to.be.equal(4);
    expect(blocks[2].foo).to.be.equal('bar');
    expect(blocks[3].height).to.be.equal(6);
    expect(blocks[3].foo).to.be.equal('bar');

    let block = await storage.findOne('blocks', {foo: 'bar'});
    expect(block.height).to.be.equal(1);
    expect(block.foo).to.be.equal('bar');

    await storage.update('blocks', {foo: 'bar'}, {foo: 'baz'});

    blocks = await storage.findAll('blocks', {foo: 'baz'});
    expect(blocks).to.be.an('array');
    expect(blocks.length).to.be.equal(4);
    expect(blocks[0].height).to.be.equal(1);
    expect(blocks[0].foo).to.be.equal('baz');
    expect(blocks[1].height).to.be.equal(3);
    expect(blocks[1].foo).to.be.equal('baz');
    expect(blocks[2].height).to.be.equal(4);
    expect(blocks[2].foo).to.be.equal('baz');
    expect(blocks[3].height).to.be.equal(6);
    expect(blocks[3].foo).to.be.equal('baz');

    await storage.updateOne('blocks', {height: 4}, {foo: 'barbaz'});
    blocks = await storage.findAll('blocks', {foo: 'barbaz'});
    expect(blocks.length).to.be.equal(1);
    expect(blocks[0].height).to.be.equal(4);
    expect(blocks[0].foo).to.be.equal('barbaz');
    blocks = await storage.findAll('blocks', {foo: 'baz'});
    expect(blocks.length).to.be.equal(3);

    await storage.remove('blocks', {height: 3});
    blocks = await storage.findAll('blocks', {});
    expect(blocks.length).to.be.equal(5);
  });

});