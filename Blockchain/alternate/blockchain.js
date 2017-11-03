const levelup = require('levelup'); // required dpt for BSPVDash
const memdown = require('memdown');

const validParameters = function (params) {
  return typeof params.genesisHeader === 'object';
  // typeof params.shouldRetarget === 'function' &&
  // typeof params.calculateTarget === 'function' &&
  // typeof params.miningHash === 'function'
};
const Blockchain = function (params, options) {
  if (!params || !validParameters(params)) throw new Error('Invalid blockchain parameters');
  // We will store here all our block headers with hash as a key and blockheader as a value
  this.chain = levelup('dash.chain', { db: require('memdown') });
  // We will here store all our height as an indexed db with height as a key, and hash as the value
  this.height = levelup('dash.height', { db: require('memdown') });
  this.tip = -1;
  const self = this;
  return this.addHeader(params.genesisHeader).then(() => self);
};
Blockchain.prototype.put = function (dbName, key, value) {
  const self = this;
  return new Promise(((resolve, reject) => {
    if (dbName === 'chain' || dbName === 'height') {
      self[dbName].put(key, value, (err) => {
        if (err) return resolve(false);
        return resolve(true);
      });
    }
  }));
};
Blockchain.prototype.get = function (dbName, key) {
  const self = this;
  return new Promise(((resolve, reject) => {
    if (dbName === 'chain' || dbName === 'height') {
      self[dbName].get(key, (err, result) => {
        if (err) return resolve(false);
        return resolve(result);
      });
    }
  }));
};
Blockchain.prototype.getTip = async function () {
  const self = this;
  return new Promise(((resolve, reject) => {
    const tipHeight = self.tip;
    console.log(self.tip);
    return resolve(self.getBlock(tipHeight));
  }));
};
Blockchain.prototype.addHeader = async function (header) {
  const self = this;
  return new Promise(((resolve, reject) => {
    const hash = Buffer.from(header.hash);
    const height = header.height;
    const value = Buffer.from(JSON.stringify(header));
    const addHeader = self.put('chain', hash, value);
    const addHeight = self.put('height', height, hash);
    Promise
      .all([addHeader, addHeight])
      .then((result) => {
        if (height > self.tip) {
          self.tip = height;
        }
        return resolve(true);
      });
  }));
};
Blockchain.prototype.getBlock = function (identifier) {
  if (identifier.constructor.name === 'Buffer') {
    return this.getBlockByBufferedHash(identifier);
  } else if (identifier.constructor.name === 'Number') {
    const height = identifier.toString();
    return this.getBlockByHeight(height);
  }
  const hash = identifier;
  return this.getBlockByHash(hash);
};
Blockchain.prototype.getBlockByBufferedHash = function (bufferedHash) {
  const self = this;
  return new Promise(((resolve, reject) => self.get('chain', bufferedHash)
    .then((header) => {
      header = JSON.parse(header.toString());
      return resolve(header);
    })));
};
Blockchain.prototype.getBlockByHash = function (hash) {
  const self = this;
  return new Promise(((resolve, reject) => {
    const bufferedHash = Buffer.from(hash);
    return self.get('chain', bufferedHash)
      .then((header) => {
        header = JSON.parse(header.toString());
        return resolve(header);
      });
  }));
};
Blockchain.prototype.getBlockByHeight = async function (height) {
  const self = this;
  return new Promise(((resolve, reject) => self
    .get('height', height)
    .then(_bufferedHash => self.get('chain', _bufferedHash)
      .then((header) => {
        header = JSON.parse(header.toString());
        return resolve(header);
      }))));
};

module.exports = Blockchain;
