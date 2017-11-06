const { Transaction } = require('bitcore-lib-dash');

const getTransaction = (utxos, authHeadAddresss, changeAddr, accData, privateKey) => {
  /* pvr: only 1 input used for now
      output with largest available amount is used
      to implement selectCoins algo (or is this already done on protocol level?)
    */
  const arr = utxos;
  const res = Math.max(...arr.map(o => o.amount));
  const obj = arr.find(o => o.amount === res);

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
    // pvr: to send full amount in production
    // (min amount just used to not deplete fundedAddr for tests)
    .to(authHeadAddresss, MIN_SEND_AMT)
    .change(changeAddr)
    .addData(JSON.stringify(accData))
    .fee(MIN_FEE)
    .sign(privateKey)
    .serialize(true);
};

const getAccountData = (username, authHeadAddresss) => ({
  action: '',
  type: '',
  accKey: username,
  pubKey: authHeadAddresss,
});

const create = (fundedAddr, username, authHeadAddresss, privKey, SDK) =>
  SDK.Explorer.API.getUTXO(fundedAddr, username)
    .then(utxos => SDK.Explorer.API.send(getTransaction(
      utxos,
      authHeadAddresss,
      fundedAddr,
      getAccountData(username, authHeadAddresss),
      privKey,
    )));

module.exports = {
  create,
};
