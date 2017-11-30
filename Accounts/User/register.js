const { Transaction, PrivateKey, Script, Address } = require('bitcore-lib-dash');
const { Output } = require('bitcore-lib-dash/lib/transaction');
const Message = require('bitcore-message-dash');
const { User } = require('@dashevo/dash-schema/lib').Consensus;
const addressAPI = require('../../Explorer/API/address');

function _createRawRegistrationSubTx(username, privateKeyString, funding = 0, utxos) {
  if (typeof funding !== 'number' || funding < 0) {
    throw new Error('Funding fee should be a positive number.');
  }
  if (typeof username !== 'string' || !User.validateUsername(username)) {
    throw new Error('Username is not valid.');
  }
  if (typeof privateKeyString !== 'string' || !PrivateKey.isValid(privateKeyString)) {
    throw new Error('Private key is not valid');
  }
  const privateKey = new PrivateKey(privateKeyString);
  const publicKey = privateKey.toPublicKey();
  const address = privateKey.toAddress();
  const registrationMessage = new Message(`register|${username}|${publicKey.toString()}`)
    .sign(privateKey);
  const regTxScript = new Script()
    .add('OP_SUBSCRIPTION')
    .add(new Buffer(registrationMessage, 'hex'));
  const output = new Output({
    satoshis: funding,
    script: regTxScript
  });
  // todo: need to estimate fee
  return new Transaction()
    .from(utxos)
    .addOutput(output)
    .change(address)
    .sign(privateKey);
}

async function register(username, privateKey = null, funding = 0) {
  if (!privateKey) {
    // TODO: create private key here
  }
  if (!funding) {
    // TODO: create funding request
  }
  const address = new PrivateKey(privateKey).toAddress();
  // Todo: not sure that api really works
  let utxos = await addressAPI.getUTXO(address);
  let subscriptionTransaction = _createRawRegistrationSubTx(username, privateKey, funding, utxos);
  /*
  * 1. Create address or use existing one.
  * 2. Request funding for this address, or skip it if address already funded
  * 3. Create and sign subTx
  * 4. Send subTx to DAPI
  * */
}

module.exports = {
  register,
  _createRawRegistrationSubTx
};