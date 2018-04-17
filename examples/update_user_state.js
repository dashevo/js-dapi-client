const { TransitionPacket, TransitionHeader } = require('../src').Core;
const { PrivateKey } = require('../src').Bitcore;
const { Api } = require('../src');

async function updateUserState(dapId, objects, privateKeyString) {
  const privateKey = new PrivateKey(privateKeyString);
  const packet = new TransitionPacket();

  objects.forEach((object) => {
    packet.addObject(object);
  });

  const header = new TransitionHeader()
    .setMerkleRoot(packet.getMerkleRoot().toString('hex'))
    .sign(privateKey);

  return Api.transition.sendRaw(
    header.serialize(),
    packet.serialize().toString('hex'),
  );
}

module.exports = updateUserState;
