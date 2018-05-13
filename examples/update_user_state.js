const { TransitionPacket, TransitionHeader } = require('@dashevo/dashcore-lib').StateTransition;
const { PrivateKey } = require('@dashevo/dashcore-lib');
const { Api } = require('../src');
const Schema = require('@dashevo/dash-schema');

const api = new Api();

async function updateUserState(dapId, userId, objects, privateKeyString) {
  const privateKey = new PrivateKey(privateKeyString);

  const dashPayContract = await api.getDapContract(dapId);

  const user = await api.getUser(userId);

  // create a packet
  const tsp = Schema.create.tspacket();
  tsp.tspacket.dapobjects = objects;
  tsp.tspacket.dapobjmerkleroot = '';
  tsp.tspacket.dapid = dapId;
  Schema.object.setID(tsp, dashPayContract.dapcontract.dapschema);

  const packetValidationState = Schema.object.validate(tsp);
  if (!packetValidationState.valid) {
    throw new Error(`Packet is not valid: ${packetValidationState.validateErrors[0].message}`);
  }

  const transitionPacket = new TransitionPacket()
    .addObject(tsp);

  const transitionHeader = new TransitionHeader()
    .setMerkleRoot(transitionPacket.getMerkleRoot().toString('hex'))
    .setRegTxHash(userId);

  if (user.transitions.length > 0) {
    transitionHeader.setPrevTransitionHash(user.transitions[user.transitions.length - 1]);
  }

  return api.sendRawTransition(
    transitionHeader.sign(privateKey).serialize(),
    transitionPacket.serialize().toString('hex'),
  );
}

module.exports = updateUserState;
