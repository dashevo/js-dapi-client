/* eslint-disable no-underscore-dangle */
// TODO: The implementation needs to be in line with Airbnb rules of not using dangling underscores

const addBlock = () => async function (blocks) {
  return new Promise((async (resolve) => {
    let listOfHeader = [];
    if (!Array.isArray(blocks)) {
      listOfHeader.push(blocks);
    } else if (blocks.length > 0) {
      listOfHeader = blocks;
    } else {
      resolve(false);
    }
    listOfHeader = listOfHeader.map(_bh => this.Blockchain._normalizeHeader(_bh));
    this.Blockchain.chain.addHeaders(listOfHeader, (err) => {
      if (err) console.error(err);
      resolve(true);
    });
  }));
};

module.exports = { addBlock };
