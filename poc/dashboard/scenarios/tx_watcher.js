const Base = require('./base');
const bloomFilter = require('bloom-filter');
const dashcore = require('@dashevo/dashcore-lib');
const { MerkleProof } = require('@dashevo/dash-spv');

class TxWathcer extends Base {
  constructor() {
    super();

    this.bloomFilter = null;
    this.txData = null;
    this.txConfirms = '';
  }

  init() {
    this.intervalIds.push(setInterval(() => this.getSpvTransactions(this.api), 1000));
  }

  getOutput() {
    return this.txConfirms;
  }

  updateTxConfirmations() {
    Promise.all((this.txData || []).map(tx => new Promise((resolve) => {
      if (tx.merkleBlock) {
        this.chain.getBlock(tx.merkleBlock.header.hash)
          .then((localBlock) => {
            resolve(`${tx.txHash}: ${tx.merkleBlock && localBlock && MerkleProof(tx.merkleBlock, localBlock, tx.txHash) ?
              '(Confirmed on chain)' : '(UNCONFIRMED)'}`);
          });
      } else {
        resolve(`${tx.txHash}: (UNCONFIRMED)`);
      }
    })))
      .then((txData) => {
        this.txConfirms = `
        Transactions: 

        ${txData.map(tx => `\n\t\t ${tx}`)}`;
      });
  }

  /* eslint-disable class-methods-use-this */
  getInput() {
    return [
      {
        type: 'input',
        name: 'pkseed',
        message: 'Enter Private Key:',
      },
      {
        type: 'list',
        name: 'noElements',
        message: 'Select number of elements for the bloomfilter',
        choices: ['10', '50', '100'],
      },
      {
        type: 'input',
        name: 'fpRate',
        message: 'Please input false positve rate (0.0 - 1.0)',
        validate(value) {
          return ((+value >= 0.0) && (+value <= 1.0)) || 'Please a valid range';
        },
        filter: Number,
      },
    ];
  }

  setBloomFilter(txObj) {
    this.filter =
      bloomFilter.create(txObj.noElements, txObj.fpRate, 0, bloomFilter.BLOOM_UPDATE_ALL);
    const pubKey = new dashcore.PrivateKey(txObj.pkseed).toPublicKey();
    this.filter.insert(dashcore.crypto.Hash.sha256ripemd160(pubKey.toBuffer()));
  }

  getSpvTransactions(api) {
    if (this.bloomFilter) {
      api.getSpvData(this.bloomFilter)
        .then((data) => {
          if (data && data.transactions) {
            this.txData = data.transactions
              .map(txObj => txObj.hash)
              .filter((txHash, index, self) => self.indexOf(txHash) === index)
              .map(txHash =>
                ({
                  txHash,
                  merkleBlock: data.merkleblocks.filter(mb => mb.hashes.includes(Buffer.from(txHash, 'hex').reverse().toString('hex')))[0],
                }));
          }
          return null;
        });
    }

    this.setBloomFilter({
      pkseed: this.answers[0],
      noElements: this.answers[1],
      fpRate: this.answers[0],
    });
  }
}

module.exports = TxWathcer;
