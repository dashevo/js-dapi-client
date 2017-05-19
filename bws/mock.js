const axios = require('axios');
const moment = require('moment');

var API = {};
API.getFeeLevels = function() {
    let self = this;
    return async function(network, cb){
        return new Promise(async function (resolve, reject) {
            // let getInsightCandidate = await self.Discover.getInsightCandidate();
            // let getInsightURI = getInsightCandidate.URI;
            let now = moment().format("YYYY-MM-DD")
            let lastblock =  await axios.get(`http://insight.dev.dash.org/api/blocks?limit=5&blockDate=${now}`).then(resp=>resp.data.blocks[0].height)
            // console.log('last block', lastblock)
            let url = network === "live" ?
                                  `http://insight.dev.dash.org/api/utils/estimatefee?nbBlocks=${lastblock||2}` :
                                  `http://insight.dev.dash.org/api/utils/estimatefee?nbBlocks=${lastblock||2}` // switch to test net url
            return axios
              .get(url)
              .then(function(response){
                // console.log(url, response.data)
                return cb(null, response.data);
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
}


API.getUtxos = function() {
    let self = this;
    return async function(cb,opts,addresses){
        return new Promise(async function (resolve, reject) {
          let promises = [];
          let url = `http://insight.dev.dash.org/api/addr`

          addresses.forEach(addr => {
            promises.push(axios.get(`${url}/${addr}/utxo`))
          });

          axios.all(promises)
          .then(res => cb(null, res[1].data));
            });
        }
    }


API.getTx = function() {
    let self = this;
    return async function(txid, cb){
        return new Promise(async function (resolve, reject) {
          let promises = [];
          let url = `http://insight.dev.dash.org/api/tx`
          return axios
            .get(`${url}/${txid}`)
            .then(function(response){
              // console.log(url, response.data)
              return cb(null, response.data);
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
  }


// API.getFeeLevels()('live',(err, x)=>{console.log('res', x)})
// API.getUtxos()((err, x)=>{console.log('res!!!', x)},'nada',['XfmtHzRb8TLGpE3z3bV9iMXr7N8UbNsLfk', 'Xmghk9LmasjpKbg6bBfFDMQwMapjbC33kU'])
// API.getTx()('02e7146fed1eeca237a0304d0d4252314773cc08273a37624bf4928275ccdd28',(err, x)=>{console.log('res', x)} )
