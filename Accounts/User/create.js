const has = require('../../util/has.js');
const { uuid } = require('khal');
const ax = require('axios');

//pvr: this code to be moved (to bitcore-lib-dash perhaps?)
function getSpendingOutput(utxos) {
    let arr = JSON.parse(utxos);
    let res = Math.max.apply(Math, arr.map(function(o) { return o.amount; }))
    let obj = arr.find(function(o) { return o.amount == res; })
}

getTransaction = function(utxos, accountData, signature) {

    const bitcore = require('bitcore-lib-dash');
    const Transaction = bitcore.Transaction;

    this.MIN_FEE = 200000;
    let sOut = getSpendingOutput(utxos);

    let trx = new Transaction()
        .from(new Transaction.UnspentOutput({
            "address": sOut.address,
            "txid": sOut.txid,
            "vout": sOut.vout,
            "scriptPubKey": sOut.scriptPubKey,
            "satoshis": +(sOut.amount) * 100000000
        }))
        .to(authHeadAddresss, this.MIN_SEND_AMT)
        .change(fundedAddress)
        .addData(JSON.stringify(accountData))
        .fee(this.MIN_FEE)

    trx.applySignature(signature);
}

getAccountData = function(username, authHeadAddresss) {
    return {
        action: '',
        type: '',
        accKey: username,
        pubKey: authHeadAddresss
    }
}
//move code end

exports.create = function() {
    let self = this;

    return async function(username, fundedAddress, signature, authHeadAddresss) {

        return self.Explorer.API.getUTXO(fundedAddress);

        // self.Explorer.API.getUTXO(fundedAddress)
        //     .then((x) => {
        //         return x;
        //     })
        //     .catch((error) => {
        //         return error;
        //     })

        // self.Explorer.API.getUTXO(fundedAddress)
        //     .then(function(utxos) {
        //         console.log('xxx' + utxos);
        //         // return new Promise(function(resolve, reject) {
        //         //     let res = { error: null, result: 'success' };
        //         //     return resolve(utxos);
        //         // });
        //         // getTransaction(utxos, getAccountData(username, authHeadAddresss, signature));
        //     });


    }
}

/*Temp
if (_u &&
    has(_u, 'username') &&
    has(_u, 'password') &&
    has(_u, 'email')
) {
    let msg = {
        type: "user",
        action: "create",
        user: _u,
        _reqId: uuid.generate.v4()
    };

    self.emitter.once(msg._reqId, function(data) {
        if (data.hasOwnProperty('error') && data.error == null) {
            return resolve(data.message);
        } else {
            return resolve(data.message);
        }
    });
    self.socket.send(JSON.stringify(msg));
}
else {
    res.error = '100 - Missing Params';
    res.result = 'Missing User';
    return resolve(res);
}

console.log(_u.params)
console.log(_u.returns)
console.log({ "query": "mutation{addRootBase(obj:" + _u.params + ")" + _u.returns + "}" })
ax.post('http://localhost:4000/graphql/graphiql',
    { "query": "mutation{add" + _u.base + "(obj:" + _u.params + ")" + _u.returns + "}" })
    .then(function(response) {
        return resolve(response.data.data)
    })
    .catch(function(error) {
        console.log(error.response.data.errors);
    });


*/