'use strict';

const levelup = require('levelup');

var BlockStore = module.exports = function() {
    this.db = levelup('dash.chain',
        {
            db: require('memdown'),
            keyEncoding: 'utf8',
            valueEncoding: 'json'
        });

    this.Block = require('bitcore-lib-dash').BlockHeader;
    this.tipHash = null;
}


BlockStore.prototype.put = function(_header) {

    this.tipHash = _header._getHash().toString('hex');

    let self = this;

    return new Promise((resolve, reject) => {

        this.db.put(self.tipHash, _header, function(err) {
            if (!err) {
                resolve(self.tipHash);
            }
            else {
                //Todo update tiphash now incorrect
                reject(err)
            }
        })
    })
}

BlockStore.prototype.get = function(hash) {

    var self = this;

    return new Promise((resolve, reject) => {
        self.db.get(hash, function(err, data) {

            if (err) {
                reject(err.message)
            }
            else {
                resolve(data);
            }

        })
    })
}

BlockStore.prototype.getTipHash = function() {
    return this.tipHash;
}



BlockStore.prototype.close = function(cb) {
    this.db.close();
}

BlockStore.prototype.isClosed = function() {
    return this.db.isClosed();
};

BlockStore.prototype.isOpen = function() {
    return this.db.isOpen();
};