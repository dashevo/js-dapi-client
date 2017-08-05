var SpvUtils = {
    getMnOnLongestChain: (mnList) => {
        //todo: Determine mn on longest chain 
        return new Promise((resolve, reject) => {
            resolve(mnList[0]);
        })
    },

    getSpvValidMn: (mn) => {
        //todo: SPV validate based on vin[0] 1000 Dash collateral
        return new Promise((resolve, reject) => {
            resolve(mn);
        })
    },
}

module.exports = SpvUtils

