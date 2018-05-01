const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const { expect } = chai;

const BitcoreLib = require('@dashevo/dashcore-lib');
const { privateKeyString } = require('../../examples/data');
const registerUser = require('../../examples/register_user');
const Api = require('../../src/api');
const { PrivateKey, PublicKey, Address } = BitcoreLib;

// const config = require('../../src/config');
// config.Api.port = 3010;

let api;

const privateKey = new PrivateKey(privateKeyString);
const publicKey = PublicKey.fromPrivateKey(privateKey);
// Change to livenet, if you want to create address for livenet
// You need to top up this address first
const address = Address
  .fromPublicKey(publicKey, 'testnet')
  .toString();

chai.use(chaiAsPromised);

describe('registerUser', async () => {

  before(async ()=>{
    // Need to start mn-bootstrap
    api = new Api();
    // Initial chain
    await api.generate(101);

    // Need to send money to address stored in address variable

    // To confirm transaction
    await api.generate(7);
  });

  beforeEach(() => {

  });

  after(() => {

  });

  it('Should create collection if it does\'nt exists', async () => {
    const username = Math.random().toString(36).substring(7);

    const userId = await registerUser(username, privateKeyString);

    await api.generate(1);

    const userProfile = api.getUser(username);

    expect(userProfile).to.be.an('object');
    expect(userProfile.uname).to.be.a('string');
  });

});