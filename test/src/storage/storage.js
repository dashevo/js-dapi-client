const sinon = require('sinon');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const Storage = require('../../../src/storage');

const fs = require('graceful-fs');

chai.use(chaiAsPromised);
const { expect } = chai;
let fsData = {};
const testDataSet = [
  { 'height': 4, 'foo': 'bar' },
  { 'height': 5 },
  { 'height': 6, 'foo': 'bar' },
  { 'height': 1, 'foo': 'bar' },
  { 'height': 2 },
  { 'height': 3, 'foo': 'bar' }
];

function createFsStub() {
  const writeStub = sinon.stub(fs, 'writeFile');
  writeStub.callsFake((path, data, callback) => {
    fsData[path] = data;
    callback(null);
  });
  const readStub = sinon.stub(fs, 'readFile');
  readStub.callsFake((path, callback) => {
    callback(null, fsData[path]);
  });
}

function restoreFs() {
  fs.writeFile.restore();
  fs.readFile.restore();
}

createFsStub();

describe('Storage', async () => {

  after(() => {
    restoreFs();
  });

  describe('.getCollection', () => {
    it('Should create collection if it does\'nt exists', async () => {
      const storage = new Storage();

      const collection = await storage.getCollection('blocks');
      expect(Array.isArray(collection.value())).to.be.equal(true);
    });
  });

  describe('.insertOne', () => {
    it('Should add one document to collection', async () => {
      const storage = new Storage();

      let blocks = await storage.findAll('blocks', {});
      expect(blocks.length).to.be.equal(0);

      await storage.insertOne('blocks', testDataSet[0]);
      blocks = await storage.findAll('blocks', {});
      expect(blocks.length).to.be.equal(1);
      expect(blocks[0]).to.be.deep.equal(testDataSet[0]);
    });
    it('Should not add document to collection if document already in collection' +
      'and unique option is specified', async () => {
      const storage = new Storage();

      let blocks = await storage.findAll('blocks', {});
      expect(blocks.length).to.be.equal(0);

      await storage.insertOne('blocks', testDataSet[0], { unique: true });
      blocks = await storage.findAll('blocks', {});
      expect(blocks.length).to.be.equal(1);
      expect(blocks[0]).to.be.deep.equal(testDataSet[0]);

      await storage.insertOne('blocks', testDataSet[0], { unique: true });
      blocks = await storage.findAll('blocks', {});
      expect(blocks.length).to.be.equal(1);
    });
  });

  describe('.insertMany', () => {
    it('Should add many documents to collection', async () => {
      const storage = new Storage();

      let blocks = await storage.findAll('blocks', {});
      expect(blocks.length).to.be.equal(0);

      await storage.insertMany('blocks', testDataSet);
      blocks = await storage.findAll('blocks', {});
      expect(blocks.length).to.be.equal(testDataSet.length);
      blocks.forEach((block, index) => {
        expect(block).to.be.deep.equal(testDataSet[index]);
      });
    });
    it('Should append documents to collection even if they are already included' +
      ' if unique option is not specified', async () => {
      const storage = new Storage();

      let blocks = await storage.findAll('blocks', {});
      expect(blocks.length).to.be.equal(0);

      await storage.insertMany('blocks', testDataSet, { unique: false });
      blocks = await storage.findAll('blocks', {});
      expect(blocks.length).to.be.equal(testDataSet.length);
      blocks.forEach((block, index) => {
        expect(block).to.be.deep.equal(testDataSet[index]);
      });

      await storage.insertMany('blocks', testDataSet.slice(0, 2), { unique: false });
      blocks = await storage.findAll('blocks', {});
      expect(blocks.length).to.be.equal(testDataSet.length + 2);
      blocks.forEach((block, index) => {
        expect(block).to.be.deep.equal(testDataSet[index % testDataSet.length]);
      });
    });
    it(
      'Should not add documents that already in collection if unique option is specified',
      async () => {
        const storage = new Storage();

        let blocks = await storage.findAll('blocks', {});
        expect(blocks.length).to.be.equal(0);

        await storage.insertMany('blocks', testDataSet, { unique: true });
        blocks = await storage.findAll('blocks', {});
        expect(blocks.length).to.be.equal(testDataSet.length);
        blocks.forEach((block, index) => {
          expect(block).to.be.deep.equal(testDataSet[index]);
        });

        await storage.insertMany('blocks', testDataSet.slice(0, 2), { unique: true });
        blocks = await storage.findAll('blocks', {});
        expect(blocks.length).to.be.equal(testDataSet.length);
        blocks.forEach((block, index) => {
          expect(block).to.be.deep.equal(testDataSet[index]);
        });
    });
  });

  describe('.findOne', () => {
    it('', async () => {
      const storage = new Storage();
    });
  });

  describe('.findAll', () => {
    it('', async () => {
      const storage = new Storage();
    });
  });

  describe('.updateOne', () => {
    it('', async () => {
      const storage = new Storage();
    });
  });

  describe('.updateMany', () => {
    it('', async () => {
      const storage = new Storage();
    });
  });

  describe('.remove()', () => {
    const storage = new Storage();
  });

  it('Should be able to save and retrieve data', async() => {
    const storage = new Storage();

    await storage.insertOne('blocks', { 'height': 1, 'foo': 'bar' });
    await storage.insertOne('blocks', { 'height': 2 });
    await storage.insertOne('blocks', { 'height': 3, 'foo': 'bar' });

    let blocks = await storage.findAll('blocks', {});
    expect(blocks.length).to.be.equal(3);

    await storage.insertMany('blocks', [
      { 'height': 4, 'foo': 'bar' },
      { 'height': 5 },
      { 'height': 6, 'foo': 'bar' }
    ]);

    blocks = await storage.findAll('blocks', {});
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

    await storage.updateMany('blocks', {foo: 'bar'}, {foo: 'baz'});

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