const SpvUtils = {
  getMnListOnLongestChain: mnLists =>
  // todo: Determine mn on longest chain
    new Promise((resolve, reject) => {
      resolve(mnLists[0]);
    }),

  getSpvValidMns: mnList =>
  // todo: SPV validate based on vin[0] 1000 Dash collateral
    new Promise((resolve, reject) => {
      resolve(mnList);
    })
  ,
};

module.exports = SpvUtils;

