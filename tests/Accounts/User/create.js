const should = require('should');
const Mnemonic = require('bitcore-mnemonic-dash');

const fundedAddr = 'yiBCPVWznF2nHDQD6H8wFWB8bhN8TKHFXc';
const username = 'pierre';
const mnemonic = new Mnemonic('jaguar paddle monitor scrub stage believe odor frown honey ahead harsh talk');
const privKey = mnemonic.toHDPrivateKey().derive('m/1').privateKey;
const authHeadAddr = mnemonic.toHDPrivateKey().derive(`m/1/${new Date() / 1000}`).privateKey.toAddress().toString(); // random new address

describe('Accounts - Create', () => {
  it('should create transaction on the blockchain with user object data', () => SDK.Accounts.API.User.create(fundedAddr, username, authHeadAddr, privKey)
    .then((res) => {
      res.should.have.property('txid').with.lengthOf(64);
    })
    .catch((err) => {
      console.log(err);
    }));
});
