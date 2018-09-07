/* eslint-disable */

const Api = require('../');
let api = null;

function getTrustedMnLists() {
    // api.getMnList not yet implemented
    return [];
}

async function getVerifiedMnList() {

    //using block 1 as nullhash as core is bugged
    const offSetHash = '3f4a8012763b1d9b985cc77b0c0bca918830b1ef7dd083665bdc592c2cd31cf6';
    const getVerfiedMnList = require('../src/Helpers/getVerfiedMnList');

    //null as target will use latest hash
    return getVerfiedMnList(offSetHash, [], null)
}

async function getHeaderChain() {
    const { SpvChain } = require('@dashevo/dash-spv');
    const dapinetGenesisHash = '000008ca1832a4baf228eb1553c03d3a2c8e02399550dd6ea8d65cec3ef23d2e'
    const dapinetGenesisHeader = await api.getBlockHeader(dapinetGenesisHash);
    dapinetGenesisHeader.prevHash = '0000000000000000000000000000000000000000000000000000000000000000'

    const headerChain = new SpvChain('custom_genesis', dapinetGenesisHeader);

    //only getting first 5 headers to save time, get all headers up to last block
    newHeaders = await api.getBlockHeaders(1, 5);
    headerChain.addHeaders(newHeaders.headers)

    //NOTE: query a few nodes by repeating the process to make sure you on the longest chain
    //headerChain instance will automatically follow the longest chain, keep track of orphans, etc
    //implementation detail @ https://docs.google.com/document/d/1jV0zCie5rVbbK9TbhkDUbbaQ9kG9oU8XTAWMVYjRc2Q/edit#heading=h.trwvf85zn0se
    return headerChain;

}

function validateCheckpoints(headerChain) {
    return true;
    //Todo:
}

async function validateCbTx(headerChain, cbTx) {
    const dashcore = require('@dashevo/dashcore-lib')
    const { MerkleProof } = require('@dashevo/dash-spv')
    const cbTxHash = new dashcore.Transaction(cbTx).getHash()

    //todo: spvchain currently do not keep track of height
    const header = headerChain.getLongestChain().filter(header => header.height === cbTx.height)

    return MerkleProof.validateMnProofs(header, proofs, cbTxHash)

}

async function start() {

    const api = new Api()
    const trustedMnLists = getTrustedMnLists(); api.MNDiscovery.masternodeListProvider.masternodeList.concat(trustedMnLists);
    const verifiedMnList = await getVerifiedMnList();
    const headerChain = await getHeaderChain();
    const validateCheckpoints = validateCheckpoints(headerChain);
    const isValidCbTx = await validateCbTx(headerChain, verifiedMnList.cbTx)

    console.log(`Node discvory ${isValidCbTx ? 'complete' : 'failed'}`)

}

// will fail halfway if executed
// start();
