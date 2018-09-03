const getVerfiedMnList = require('../src/Helpers/getVerfiedMnList');

const log = console;

// Core bug: base block 0000000000000000000000000000000000000000000000000000000000000000
// is higher then block... Using block 1 as nullhash until this is fixed
const nullhash = '3f4a8012763b1d9b985cc77b0c0bca918830b1ef7dd083665bdc592c2cd31cf6';
const allMnsActiveAtHash = '000004543e350b99f43114fe0bf649344a28f4fde6785d80e487d90689ae3918';
const deletedMnHash = '00000f5da94df7df6d8715e149467a5e859fe5db48366a68ab94dadc389097e7';

getVerfiedMnList(nullhash, [], allMnsActiveAtHash)
  .then((mnList) => {
    log.info('\nMnList @ block 2896 - 3 mns valid:');
    log.info(JSON.stringify(mnList, null, 4));
    return getVerfiedMnList(allMnsActiveAtHash, mnList, deletedMnHash);
  }).then((mnList) => {
    log.info('\nMnList @ block 2897 - 2 mns valid, 1 removed:');
    log.info(JSON.stringify(mnList, null, 4));
    return getVerfiedMnList(deletedMnHash, mnList);
  }).then((mnList) => {
    log.info('\nMnList @ latest block - deleted mn added back at block 2904:');
    log.info(JSON.stringify(mnList, null, 4));

    // Keep checking for updates to at each block
    const delay = 2.5 * 60 * 1000; // 2.5mins (in future dapi will notify of new blocks)
    setInterval(() => {
      // mnList = getVerfiedMnList(deletedMnHash, mnList);
    }, delay);
  });

