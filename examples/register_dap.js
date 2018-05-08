const { TransitionPacket, TransitionHeader } = require('@dashevo/dashcore-lib').StateTransition;
const Schema = require('@dashevo/dash-schema');
const { PrivateKey } = require('../src').Bitcore;
const { Api } = require('../src');

const api = new Api();

async function registerDap(dapSchema, privateKeyString, userId) {
  const privateKey = new PrivateKey(privateKeyString);

  const dapContract = Schema.create.dapcontract(dapSchema);

  // create a packet
  const tsp = Schema.create.tspacket();
  tsp.tspacket.dapcontract = dapContract.dapcontract;
  tsp.tspacket.dapid = dapContract.dapcontract.meta.dapid;
  Schema.object.setID(tsp);

  const validTsp = Schema.object.validate(tsp);
  if (!validTsp.valid) {
    throw new Error('Packet is not valid.');
  }

  // create a transition
  // const ts = Schema.create.tsheader(tsp.tspacket.meta.id, this._currentUser.blockchainuser.uid);
  // Schema.object.setID(ts);
  // if (!Schema.object.validate(ts).valid) {
  //   throw new Error('Transition header is not valid');
  // }

  const transitionPacket = new TransitionPacket()
    .addObject(tsp);

  const transitionHeader = new TransitionHeader()
    .setMerkleRoot(transitionPacket.getMerkleRoot().toString('hex'))
    .setRegTxHash(userId)
    .sign(privateKey)
    .serialize();

  return api.sendRawTransition(
    transitionHeader,
    transitionPacket.serialize().toString('hex'),
  );
}

module.exports = registerDap;
