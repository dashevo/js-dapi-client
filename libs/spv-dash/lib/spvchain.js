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

let getMerkleProofs = function(localBlockHash, localMerkleRoot, filterAddr = null) {

    return new Promise(function(resolve, reject) {
        //test.insight.dash.siampm.com
        var Peer = require('bitcore-p2p-dash').Peer;
        var Pool = require('bitcore-p2p-dash').Pool;
        var peer = new Peer({ host: 'test.insight.dash.siampm.com', port: '19999', network: 'testnet' }); //local: 127.0.0.1
        var pool = new Pool({ network: 'testnet' });

        peer.on('ready', function() {

            //not working
            if (filterAddr) {
                var BloomFilter = require('bitcore-p2p-dash').BloomFilter;
                var code = new Buffer(filterAddr, 'base64');
                var filter = BloomFilter.create(1, 0.1);
                filter.insert(code);
            }

            //Investigate pool/peer message mix, seems to be only way to get it to work
            pool.sendMessage(peer.messages.FilterLoad(filter));
            pool.sendMessage(peer.messages.GetData.forFilteredBlock(localBlockHash));
        })

        pool.on('peerheaders', function(peer, message) {
            console.log('peerheaders:' + JSON.stringify(message))
        });

        pool.on('peermerkleblock', function(peer, message) {

            if (utils.getCorrectedHash(message.merkleBlock.header.merkleRoot) != localMerkleRoot) {
                reject('merkle roots does not match on spv chain')
            }
            else {
                let bmp = require('bitcoin-merkle-proof');
                try {
                    resolve(
                        bmp.verify({
                            flags: message.merkleBlock.flags,
                            hashes: message.merkleBlock.hashes.map(h => Buffer.from(h, 'hex')),
                            numTransactions: message.merkleBlock.numTransactions,
                            merkleRoot: message.merkleBlock.header.merkleRoot
                        }))
                }
                catch (e) {
                    reject(e)
                }
            }
        });

        //https://en.bitcoin.it/wiki/Protocol_documentation#Inventory_Vectors
        //Only types 0 - 4 but currently getting types of 15, 16, 7, 8 ??
        peer.on('inv', function(message) {
            // console.log(`inv: ${JSON.stringify(message.inventory)}`)

            if (message.inventory.filter(i => i.type == 3).length > 0) {
                console.log('MERKLE BLOCK !!!!' + JSON.stringify(message.inventory)); //not happening :(
            }
        });

        peer.on('tx', function(message) {
            console.log(`tx: ${message.transaction}`)
        });

        peer.on('addr', function(message) {
            console.log(`addr: ${JSON.stringify(message.addresses)}`)
        });

        peer.on('disconnect', function() {
            console.log('connection closed');
        })

        peer.on('error', function(err) {
            console.log(err);
        })

        pool.connect();
        peer.connect();
    })

}

Blockchain.prototype.getMerkleProof = function(blockHash, txHash, filterAddr) {

    this.store.get(blockHash)
        .then(localBlock => {
            if (!localBlock) {
                throw new Exception(`header block with hash ${blockHash} not found on local spv chain`)
            }
            else {
                return getMerkleProofs(localBlock.hash, localBlock.merkleRoot, filterAddr);
            }
        })
        .then(proofs => {

            if (proofs.length == 0) {
                //coinbase tx only so 
                //merkle root matches txHash so can do this check here
                console.log('SPV VALIDTION SUCCESS')
            }
            else if (proofs.contains(txHash)) {//wont execute (pseudo code)
                //because its difficult to build a chain form genesis up to a block that contains more than the coinbase tx
                //a check still needs to be done here (the txHash should be in the set of proofs which is matching transactions of the bloom filter)
                //earlier versions of the POC did sucessfully test this without depending on the locally constructed SPV chain
                console.log('SPV VALIDTION SUCCESS')
            }
            else {
                console.log('SPV FAILED')
            }


        })
        .catch(err => {
            console.log(err);
        })
}



