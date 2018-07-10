const Base = require('./base');

class ChainStatus extends Base {
  constructor(chain) {
    super();
    this.chain = chain;
  }

  getOutput() {
    return `

      Current block       : ${this.chain.getChainHeight()}
  
      Last block hash     : ${this.chain.getTipHash()}
  
      Longest Chain POW   : ${this.chain.getBestFork().getPOW()}
      
      Connected peers   : 1
  
      Orphan Chains     : ${this.chain.getAllForks().length - 1}
      - *Chain 1 (POW: 1.0000000005019675)
      - *Chain 2 (POW: 1.0000000015019675)
      - *...
















      (* Hardcoded)
      `;
  }
}

module.exports = ChainStatus;
