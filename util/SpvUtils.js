const SpvUtils = {
  getMnListOnLongestChain: mnLists =>
  // TODO: Determine mn on longest chain
    new Promise((resolve) => {
      resolve(mnLists[0]);
    }),

  getSpvValidMns: mnList =>
  // TODO: SPV validate based on vin[0] 1000 Dash collateral
    new Promise((resolve) => {
      resolve(mnList);
    })
  ,
};

module.exports = SpvUtils;
