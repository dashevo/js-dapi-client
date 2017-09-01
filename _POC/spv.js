// create blockchain
var blockchain = require('../libs/spv-dash/lib/spvchain')
const chain = new blockchain()
const bitcore = require('bitcore-lib-dash');

var getHeaders = function(startHeight) {


    //When available....
    //SDK.Explorer.API.getHeaders(startHeight) //Get max headers --> returns a promise

    return new Promise((resolve, reject) => {


        let blocksTestNet =
            [
                { "version": 2, "merkleroot": "b4fd581bc4bfe51a5a66d8b823bd6ee2b492f0ddc44cf7e820550714cedc117f", "time": 1398712771, "nonce": 31475, "bits": "1e0fffff", "previousblockhash": "00000bafbc94add76cb75e2ec92894837288a481e5c005f6563d91623bf8bc2c" },
                { "version": 2, "merkleroot": "0d6d332e68eb8ecc66a5baaa95dc4b10c0b32841aed57dc99a5ae0b2f9e4294d", "time": 1398712772, "nonce": 6523, "bits": "1e0ffff0", "previousblockhash": "0000047d24635e347be3aaaeb66c26be94901a2f962feccd4f95090191f208c1" },
                { "version": 2, "merkleroot": "1cc711129405a328c58d1948e748c3b8f3d610e66d9901db88c42c5247829658", "time": 1398712774, "nonce": 53194, "bits": "1e0ffff0", "previousblockhash": "00000c6264fab4ba2d23990396f42a76aa4822f03cbc7634b79f4dfea36fccc2" },
                //forked chain with eventual higher POW starts here linking to the second block (headers[1]) in this list

                //original chain with eventual lower POW continues here

                //forked chain 3'rd block which causes triggers a re-org (check for re-orgs every 3 blocks - changeable setting)
            ]

        let block1LiveNet = { "hash": "000007d91d1254d60e2dd1ae580383070a4ddffa4c64c2eeb4a2f9ecc0414343", "confirmations": 724402, "size": 186, "height": 1, "version": 2, "merkleroot": "ef3ee42b51e2a19c4820ef182844a36db1201c61eb0dec5b42f84be4ad1a1ca7", "tx": ["ef3ee42b51e2a19c4820ef182844a36db1201c61eb0dec5b42f84be4ad1a1ca7"], "time": 1390103681, "mediantime": 1390103681, "nonce": 128987, "bits": "1e0ffff0", "difficulty": 0.000244140625, "chainwork": "0000000000000000000000000000000000000000000000000000000000200020", "previousblockhash": "00000ffd590b1485b3caadc19b22e6379c733355108f107a430458cdf3407ab6", "nextblockhash": "00000bafcc571ece7c5c436f887547ef41b574e10ef7cc6937873a74ef1efeae", "isMainChain": true, "poolInfo": { "poolName": "Q/P2SH/" }, "cbvalue": 500 }

        const utils = require('../libs/spv-dash/lib/utils');
        resolve(blocksTestNet.map(b => utils._normalizeHeader(b)));
    });
}

var initChainFromStorage = function() {
    //todo
}

var doConstuctChainThenValidateTest = function() {
    const filterAddr = 'yMSUh839et5ZF8bk3SXHA7NPbyDgigUbfG' //optional for bloomfilters

    //coinbase tx hash of block 3
    const validationTxHash = '1cc711129405a328c58d1948e748c3b8f3d610e66d9901db88c42c5247829658';

    //block 3 hash. Note if tx indexing is enabled (usally false) on full nodes this might be ommited 
    let validationBlockHash = null
    getHeaders(0)
        .then(headers => {
            validationBlockHash = headers[2]._getHash().toString('hex');
        })

    let localStoredFile = false;
    if (localStoredFile) {
        loadChainFromStorage();
    }
    else {
        let currHeight = chain.getChainHeight();

        getHeaders(currHeight + 1)
            .then(headers => {
                if (headers) {
                    chain._addHeaders(headers);
                    //Todo add headers until tip of blockchain
                    return true;
                }
                else {
                    //todo
                    return true;
                }
            })
            .then(success => {
                if (success) {
                    console.log(`Success: Added & validated blocks to SPV chain (building on genesis block)`)
                    return chain.getMerkleProof(validationBlockHash, validationTxHash, filterAddr, false)
                }
                else {
                    //todo                
                }

            })
            .then(isvalid => {
                if (isvalid) {
                    console.log(`${validationTxHash} is validated!`)
                    //todo: SDK.Explorer.API.getTx(validationTxHash) to update balances etc
                    //the resulting full tx string can be hashed again to make sure it equals validationTxHash
                }
                else {

                }
            })
            .catch(err => {
                console.log(` ${err}`)
            })
    }
}

var utils = require('../libs/spv-dash/lib/utils')
getNewBlock = function(prev, bits) {
    return utils.createBlock(prev, parseInt(bits, 16));
}

getForkedHeaders = function() {

    //init chain with custom genesis

    var headers = [];

    headers.push(getNewBlock(null, '1fffffff')); //0

    //normal chain 1 block - connects to genesis
    headers.push(getNewBlock(headers[0], '1ffffffe')); //1

    //fork 2 blocks - connects to genesis
    headers.push(getNewBlock(headers[0], '1fffff0d')); //2
    headers.push(getNewBlock(headers[2], '1fffff0c')); //3

    //normal chain 2'nd block
    headers.push(getNewBlock(headers[1], '1ffffffd')); //4

    //fork 3'rd block = trigger re-org because cumalative difficulty on fork is higher
    headers.push(getNewBlock(headers[3], '1fffff0b')); //5

    return headers;
}

doForkThenReorgTest = function() {

    //Custom genesis to test with lower difficulty
    return require('./utils')._normalizeHeader(
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


    chain._addHeaders(getForkedHeaders());
}

// wait for the blockchain to be ready
chain.on('ready', function() {

    // doConstuctChainThenValidateTest();
    doForkThenReorgTest();
}, this);

//Todo list
//Save/Load existing chain from client storage
//Apply bloomfilters
//Handle forks/reogrs
//Listen to address for incomming transactions
//Update local balances / validate txData
//Add all headers to tip of blockchain

