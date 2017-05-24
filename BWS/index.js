const axios = require('axios');
const moment = require('moment');

exports.BWS = function(){
let self = this;
    return {
        BWS:{
          getFeeLevels: function() {
              // let self = this;
              return async function(network, cb){
                  return new Promise(async function (resolve, reject) {
                      let getInsightCandidate = await self.Discover.getInsightCandidate();
                      let getInsightURI = getInsightCandidate.URI;
                      let now = moment().format("YYYY-MM-DD")
                      let lastblock =  await axios.get(`${getInsightURI}/blocks?limit=5&blockDate=${now}`).then(resp=>resp.data.blocks[0].height)
                      let url = `${getInsightURI}/utils/estimatefee?nbBlocks=${lastblock||2}`
                      return axios
                        .get(url)
                        .then(function(response){
                          console.log(url, response.data)
                          return resolve(cb(null, response.data));
                        })
                        .catch(function(error){
                          if(error){
                              console.log(url, error)
                              console.error(`An error was triggered getting fee estimates `);
                              return cb(false);
                          }
                      });
                  });
              }
          },
          getUtxos: function() {
              // let self = this;
              return async function(cb,opts,addresses){
                  return new Promise(async function (resolve, reject) {
                    let getInsightCandidate = await self.Discover.getInsightCandidate();
                    let getInsightURI = getInsightCandidate.URI;
                    let url = `${getInsightURI}/addr`
                    let promises = [];


                    addresses.forEach(addr => {
                      promises.push(axios.get(`${url}/${addr}/utxo`))
                    });

                    axios.all(promises)
                    .then(res => {
                      console.log(49, res)
                      resolve(cb(null, res[1].data))});
                      });
                  }
            },
            getTx: function() {
                // let self = this;
                return async function(txid, cb){
                    return new Promise(async function (resolve, reject) {
                      let getInsightCandidate = await self.Discover.getInsightCandidate();
                      let getInsightURI = getInsightCandidate.URI;
                      let url = `${getInsightURI}/tx`

                      return axios
                        .get(`${url}/${txid}`)
                        .then(function(response){
                          console.log(`${url}/${txid}`, response.data)
                          return resolve(cb(null, response.data));
                        })
                        .catch(function(error){
                          if(error){
                              console.log(url, error)
                              console.error(`An error was triggered getting tx {txid} `);
                              return cb(false);
                          }
                      });
                    })
                }
            },
            getBalance: function() {
                // let self = this;
                return async function(twoStep, cb){
                    return new Promise(async function (resolve, reject) {
                      let res =  await SDK.Explorer.API.getBalance('yj6xVHMyZGBdLqGUfoGc9gDvU8tHx6iqb4')
                      //how do you know the address to use? prob stored on the opt object that is global? use placehodler for now
                      return resolve(cb(null, res))}
                      );
                    }
              },
              broadcastRawTx: function() {
                  // let self = this;
                  return async function(opts, network, rawTx, cb){
                      return new Promise(async function (resolve, reject) {
                        let res = await SDK.Explorer.API.send('01000000010000000000000000000000000000000000000000000000000000000000000000ffffffff13033911030e2f5032506f6f6c2d74444153482fffffffff0479e36542000000001976a914f0adf747fe902643c66eb6508305ba2e1564567a88ac40230e43000000001976a914f9ee3a27ef832846cf4ad40fe95351effe4a485d88acc73fa800000000004341047559d13c3f81b1fadbd8dd03e4b5a1c73b05e2b980e00d467aa9440b29c7de23664dde6428d75cafed22ae4f0d302e26c5c5a5dd4d3e1b796d7281bdc9430f35ac00000000000000002a6a283662876fa09d54098cc66c0a041667270a582b0ea19428ed975b5b5dfb3bca79000000000200000000000000')
                        //how do you know the address to use? prob stored on the opt object that is global? use placehodler for now
                        console.log('bws', 94, res)
                        return resolve(cb(null, res))}
                        );
                      }
                },
        }
      }
};


// API.getFeeLevels()('live',(err, x)=>{console.log('res', x)})
// API.getUtxos()((err, x)=>{console.log('res!!!', x)},'nada',['XfmtHzRb8TLGpE3z3bV9iMXr7N8UbNsLfk', 'Xmghk9LmasjpKbg6bBfFDMQwMapjbC33kU'])
// API.getTx()('02e7146fed1eeca237a0304d0d4252314773cc08273a37624bf4928275ccdd28',(err, x)=>{console.log('res', x)} )
