'use strict';
const utils = require('./utils');

const EventEmitter = require('events').EventEmitter,
    BlockStore = require('./blockstore'),
    bitcore = new require('bitcore-lib-dash'),
    inherits = require('inherits');

//Todo:move to seperate file
let getDefaultGenesisBlock = function() {

    //Testnet genesis
    return utils._normalizeHeader(
        {
            "version": 1,
            "previousblockhash": null,
            "merkleroot": 'e0028eb9648db56b1ac77cf090b99048a8007e2bb64b68f092c03c7f56a662c7',
            "time": 1390666206, //1390095618 for livenet
            "bits": '1e0ffff0',
            "nonce": 3861367235, //28917698 for livenet
            "hash": '00000bafbc94add76cb75e2ec92894837288a481e5c005f6563d91623bf8bc2c'
        }
    )
}

var ForkedChain = require('./forkedChain')

var Blockchain = module.exports = function(genesisHeader = getDefaultGenesisBlock()) {
    this.store = new BlockStore();
    this.chainHeight = 0;
    this.forkedChains = [];
    this.genesisHeader = genesisHeader;
    this.POW = 0; //difficulty summed

    this._initStore();
}
inherits(Blockchain, EventEmitter);

Blockchain.prototype._initStore = function() {
    let self = this;

    if (!this.store.getTipHash()) {
        this.putStore(self.genesisHeader)
            .then(() => {
                self.emit('ready');
            })
    }
    else {
        self.emit('ready');
    }
}

Blockchain.prototype.putStore = function(block) {
    this.POW += block.bits;
    return this.store.put(block);
}

Blockchain.prototype.isValidBlock = function(header) {
    return header.validProofOfWork() &&
        header.validTimestamp &&
        header.getDifficulty() > 0; //todo: do some darkgravitywave check here or is this included in the validProofOfWork() check?
}

Blockchain.prototype.addCachedBlock = function(block) {
    let tipConnection = this.forkedChains.filter(fc => fc.isConnectedToTip(block))
    let headConnection = this.forkedChains.filter(fc => fc.isConnectedToHead(block))

    block.getDifficulty()

    if (tipConnection.length > 0) {
        tipConnection[0].addTip(block);
    }
    else if (headConnection.length > 0) {
        headConnection[0].addHead(block);
    }
    else {
        this.forkedChains.push(new ForkedChain(block, this.POW, this.store.getTipHash()));
    }
}

Blockchain.prototype.processMaturedChains = function() {

    let maxDifficulty = Math.max.apply(Math, this.forkedChains.map(f => f.getPOW()));
    let bestChainMaturedBlocks = this.forkedChains.find(f => f.getPOW() == maxDifficulty).getMaturedBlocks();

    for (let i = 0; i < bestChainMaturedBlocks.length; i++) {
        this.putStore(bestChainMaturedBlocks.pop());
    }

    //todo: kill expired chains
}

Blockchain.prototype._addHeader = function(header) {

    if (!this.isValidBlock(header)) {
        throw new Exception('Block does not conform to header consensus rules');
    }
    else {
        console.log(`${header.bits} ${utils.getDifficulty(header.bits)}`)
        this.addCachedBlock(header);
        this.processMaturedChains();
    }
}

Blockchain.prototype._addHeaders = function(headers) {

    let self = this;
    headers.forEach(function(header) {
        self._addHeader(header);
    })
}

Blockchain.prototype.getChainHeight = function() {
    return this.chainHeight;
}

let



