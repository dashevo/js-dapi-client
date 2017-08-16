// import blockchain parameters for Dash
const levelup = require('levelup');
global.SDK = require('../Connector/dapiFactory.js')();


// create a LevelUp database where the block data should be stored
var db = levelup('dash.chain', { db: require('memdown') })

// create blockchain
var Blockchain = require('blockchain-spv-dash')
var chain = new Blockchain(require('webcoin-dash-testnet').blockchain, db)

getTmpBlock = () => {

    let block0 = `{"hash":"00000ffd590b1485b3caadc19b22e6379c733355108f107a430458cdf3407ab6","confirmations":721115,"size":306,"height":0,"version":1,"merkleroot":"e0028eb9648db56b1ac77cf090b99048a8007e2bb64b68f092c03c7f56a662c7","tx":["e0028eb9648db56b1ac77cf090b99048a8007e2bb64b68f092c03c7f56a662c7"],"time":1390095618,"mediantime":1390095618,"nonce":28917698,"bits":"1e0ffff0","difficulty":0.000244140625,"chainwork":"0000000000000000000000000000000000000000000000000000000000100010","nextblockhash":"000007d91d1254d60e2dd1ae580383070a4ddffa4c64c2eeb4a2f9ecc0414343","isMainChain":true}`
    let block1 = `{"hash":"000007d91d1254d60e2dd1ae580383070a4ddffa4c64c2eeb4a2f9ecc0414343","confirmations":721065,"size":186,"height":1,"version":2,"merkleroot":"ef3ee42b51e2a19c4820ef182844a36db1201c61eb0dec5b42f84be4ad1a1ca7","tx":["ef3ee42b51e2a19c4820ef182844a36db1201c61eb0dec5b42f84be4ad1a1ca7"],"time":1390103681,"mediantime":1390103681,"nonce":128987,"bits":"1e0ffff0","difficulty":0.000244140625,"chainwork":"0000000000000000000000000000000000000000000000000000000000200020","previousblockhash":"00000ffd590b1485b3caadc19b22e6379c733355108f107a430458cdf3407ab6","nextblockhash":"00000bafcc571ece7c5c436f887547ef41b574e10ef7cc6937873a74ef1efeae","isMainChain":true,"poolInfo":{"poolName":"Q/ P2SH / "},"cbvalue":500}`

    return new Promise((resolve, reject) => {
        resolve(JSON.parse(block1))
    })
}

// wait for the blockchain to be ready
chain.on('ready', function() {

    SDK.Explorer.API.getBlock(1)
        // getTmpBlock()
        .then(block => {
            let header = {
                bits: block.bits,
                merkleRoot: block.merkleroot,
                nonce: block.nonce,
                prevHash: block.previousblockhash,
                timestamp: block.time,
                version: block.version
            }

            let headers = [SDK.Blockchain._normalizeHeader(block)]

            chain.addHeaders(headers, (err) => {
                if (err) console.log(err)
            })
        })
        .catch(ex => {
            console.log(ex)
        })
});

