const DashUtil = require('dash-util')
const bitcore = new require('bitcore-lib-dash');


var validProofOfWork = function(header) {
    var target = DashUtil.expandTarget(header.bits)
    var hash = header._getHash().reverse(); //replacement for require(bufer-reverse).reverse()
    return hash.compare(target) !== 1
}

module.exports = {

    createBlock: function(prev, bits) {
        var i = 0;
        var header = null;
        do {
            header = new bitcore.BlockHeader({
                version: 2,
                prevHash: prev ? prev._getHash() : DashUtil.nullHash,
                merkleRoot: DashUtil.nullHash,
                time: prev ? (prev.time + 1) : Math.floor(Date.now() / 1000),
                bits: bits,
                nonce: i++
            })
        } while (!validProofOfWork(header))
        return header
    },

    _normalizeHeader: function(_b) {
        let _el = JSON.parse(JSON.stringify(_b));
        let bh = {};
        if (_b.constructor.name == "BlockHeader") {
            return _b;
        }
        if (
            _el.hasOwnProperty("version") &&
            _el.hasOwnProperty("previousblockhash") &&
            _el.hasOwnProperty("merkleroot") &&
            _el.hasOwnProperty("time") &&
            _el.hasOwnProperty("bits") &&
            _el.hasOwnProperty("nonce")
        ) {
            if (!_el.previousblockhash) {
                _el.previousblockhash = new Buffer('0000000000000000000000000000000000000000000000000000000000000000', 'hex');
            }
            else {
                _el.previousblockhash = DashUtil.toHash(_el.previousblockhash);
            }
            _el.merkleroot = DashUtil.toHash(_el.merkleroot);
            bh = {
                version: _el.version,
                prevHash: _el.previousblockhash,
                merkleRoot: _el.merkleroot,
                time: _el.time,
                bits: parseInt(_el.bits, 16),
                nonce: _el.nonce
            };

            return new bitcore.BlockHeader.fromObject(bh);
        }
        if (
            _el.hasOwnProperty("version") &&
            _el.hasOwnProperty("prevHash") &&
            _el.hasOwnProperty("merkleRoot") &&
            _el.hasOwnProperty("time") &&
            _el.hasOwnProperty("bits") &&
            _el.hasOwnProperty("nonce")
        ) {
            if (!Buffer.isBuffer(_el.prevHash)) {
                _el.prevHash = DashUtil.toHash(_el.prevHash) || new Buffer('0000000000000000000000000000000000000000000000000000000000000000', 'hex');
                _el.merkleRoot = DashUtil.toHash(_el.merkleRoot);
                _el.bits = parseInt(_el.bits, 16);
            }
            bh = {
                version: _el.version,
                prevHash: _el.prevHash,
                merkleRoot: _el.merkleRoot,
                time: _el.time,
                bits: _el.bits,
                nonce: _el.nonce
            };
            return new bitcore.BlockHeader.fromObject(bh);
        }
        return false;
    }

}