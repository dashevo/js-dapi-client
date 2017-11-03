const { clone } = require('khal');
const Buffer = require('../util/Buffer');
const DashUtil = require('dash-util');
const Bitcore = require('bitcore-lib-dash');

exports.addBlock = function () {
  const self = this;
  return async function (blocks) {
    return new Promise((async (resolve, reject) => {
      let listOfHeader = [];
      if (!Array.isArray(blocks)) {
        listOfHeader.push(blocks);
      } else if (blocks.length > 0) {
        listOfHeader = blocks;
      } else {
        return resolve(false);
      }
      listOfHeader = listOfHeader.map(_bh => self.Blockchain._normalizeHeader(_bh));
      self.Blockchain.chain.addHeaders(listOfHeader, (err) => {
        if (err) console.error(err);
        return resolve(true);
      });
      // return resolve(true);
    }));
  };
};
