const Base = require('./base');

class ChainStatus extends Base {
  constructor(chain, peers) {
    super();
    this.chain = chain;
    this.peers = peers;
  }

  getOutput() {
    return `

      Start block         : ${this.chain.getChainHeight()}
  
      Last block hash     : ${this.chain.getTipHash()}
  
      Longest Chain POW   : ${this.chain.getBestFork().getPOW()}
      
      Connected peers     : ${this.peers.length}
      ${this.peers.map(p => p.ip)}
  
      Orphan Chains       : ${this.chain.getAllForks().length - 1}
      - *Chain 1 (POW: 1.0000000005019675)
      - *Chain 2 (POW: 1.0000000015019675)
      - *...
















      (* Hardcoded)
      `;
  }
}

module.exports = ChainStatus;
