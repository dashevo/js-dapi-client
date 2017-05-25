require('../_before.js');
const should = require('should');


/*

tests

let bwsfee = await SDK.BWS.BWS.getFeeLevels()('live',(err, x)=>{console.log('bws fee', x)})
  let bwsutxo = await SDK.BWS.BWS.getUtxos()((err, x)=>{console.log('bws utxo', x)},'nada',['yb21342iADyqAotjwcn4imqjvAcdYhnzeH', 'yb21342iADyqAotjwcn4imqjvAcdYhnzeH'])
  let bwstx = await SDK.BWS.BWS.getTx()('65d4f6369bf8a0785ae05052c86da4a57f76866805e3adadc82a13f7da41cbdf',(err, x)=>{console.log('bws tx', x)})
let bwsbal = await SDK.BWS.BWS.getBalance()('yj6xVHMyZGBdLqGUfoGc9gDvU8tHx6iqb4',(err, x)=>{console.log('bws balance', x)})
let bwssend= await SDK.BWS.BWS.broadcastRawTx()(1,1,'01000000010000000000000000000000000000000000000000000000000000000000000000ffffffff13033911030e2f5032506f6f6c2d74444153482fffffffff0479e36542000000001976a914f0adf747fe902643c66eb6508305ba2e1564567a88ac40230e43000000001976a914f9ee3a27ef832846cf4ad40fe95351effe4a485d88acc73fa800000000004341047559d13c3f81b1fadbd8dd03e4b5a1c73b05e2b980e00d467aa9440b29c7de23664dde6428d75cafed22ae4f0d302e26c5c5a5dd4d3e1b796d7281bdc9430f35ac00000000000000002a6a283662876fa09d54098cc66c0a041667270a582b0ea19428ed975b5b5dfb3bca79000000000200000000000000',(err, x)=>{console.log('bws balance', x)}); //other params
  let bwstxhist = await SDK.BWS.BWS.getTxHistory()({}, 0, 10, false, (err, x)=>{console.log('bws txhist', x)})

*/

describe('BWS - getFeeLevels', function() {
    it('should return the fee as a number', async function(){
        let fee = await SDK.BWS.BWS.getFeeLevels()('live',(err, x)=>x);
        fee.should.be.a.Number();
    });
});

describe('BWS - getBalance', function() {
    it('should return the fee as a number', async function(){
        let fee = await SDK.BWS.BWS.getBalance()('yj6xVHMyZGBdLqGUfoGc9gDvU8tHx6iqb4',(err, x)=>x);
        fee.should.be.a.Number();
        fee.should.be.aboveOrEqual(0);
;
    });
});

describe('BWS - broadcastRawTx', function() {
    it('should return a boolean', async function(){
        let fee = await SDK.BWS.BWS.broadcastRawTx()(1,1,'01000000010000000000000000000000000000000000000000000000000000000000000000ffffffff13033911030e2f5032506f6f6c2d74444153482fffffffff0479e36542000000001976a914f0adf747fe902643c66eb6508305ba2e1564567a88ac40230e43000000001976a914f9ee3a27ef832846cf4ad40fe95351effe4a485d88acc73fa800000000004341047559d13c3f81b1fadbd8dd03e4b5a1c73b05e2b980e00d467aa9440b29c7de23664dde6428d75cafed22ae4f0d302e26c5c5a5dd4d3e1b796d7281bdc9430f35ac00000000000000002a6a283662876fa09d54098cc66c0a041667270a582b0ea19428ed975b5b5dfb3bca79000000000200000000000000',(err, x)=>x);
        fee.should.be.a.Boolean();
    });
});

describe('BWS - getFeeLevels', function() {
    it('should return the fee as a number', async function(){
        let fee = await SDK.BWS.BWS.getFeeLevels()('live',(err, x)=>x);
        fee.should.be.a.Number();
    });
});
