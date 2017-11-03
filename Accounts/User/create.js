const Transaction = require('bitcore-lib-dash').Transaction;

function getSpendingOutput(utxos) {
  const arr = JSON.parse(utxos);
  const res = Math.max(...arr.map(o => o.amount));
  const obj = arr.find(o => o.amount == res);
}

getTransaction = function (utxos, authHeadAddresss, changeAddr, accData, privateKey) {
  /* pvr: only 1 input used for now
      output with largest available amount is used
      to implement selectCoins algo (or is this already done on protocol level?)
    */
  const arr = utxos;
  const res = Math.max(...arr.map(o => o.amount));
  const obj = arr.find(o => o.amount == res);

  const utxo = new Transaction.UnspentOutput({
    address: obj.address,
    txid: obj.txid,
    vout: obj.vout,
    scriptPubKey: obj.scriptPubKey,
    satoshis: +(obj.amount) * 100000000,
  });

  const MIN_FEE = 200000;
  const MIN_SEND_AMT = 500000;

  return new Transaction()
    .from(utxo)
    .to(authHeadAddresss, MIN_SEND_AMT) // pvr: to send full amount in production (min amount just used to not deplete fundedAddr for tests)
    .change(changeAddr)
    .addData(JSON.stringify(accData))
    .fee(MIN_FEE)
    .sign(privateKey)
    .serialize(true);
};

getAccountData = function (username, authHeadAddresss) {
  return {
    action: '',
    type: '',
    accKey: username,
    pubKey: authHeadAddresss,
  };
};

exports.create = function (fundedAddr, username, authHeadAddresss, privKey) {
  return SDK.Explorer.API.getUTXO(fundedAddr, username)
    .then(utxos => SDK.Explorer.API.send(getTransaction(
      utxos,
      authHeadAddresss,
      fundedAddr,
      getAccountData(username, authHeadAddresss),
      privKey,
    )));
};
