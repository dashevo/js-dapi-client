const explorerGet = require('../Common/ExplorerHelper').explorerGet;
const axios = require('axios');
const moment = require('moment');
const Mnemonic = require('../util/mnemonic');
const Bitcoin = require('bitcoinjs-lib');

exports.getMainAddress = function (opts, noVerify, limit, reverse, rootKey, _mnemonic, _seed) {
  return new Promise((async (resolve, reject) => {
    // console.log(113, Mnemonic, Mnemonic.generateSeedFromMnemonic )
    const bip32Seed = _seed || Mnemonic.generateSeedFromMnemonic(_mnemonic);
    // console.log(9, 'bip32Seed',  bip32Seed)
    const dashTestnet = {
      messagePrefix: '\x19DarkCoin Signed Message:\n',
      bip32: { public: 70615939, private: 70615956 }, // Default was 50221816, but Copay use this one.
      pubKeyHash: 140, // 140=y (139=y||x)
      scriptHash: 19,
      wif: 239,
      dustThreshold: 5460, // https://github.com/dashpay/dash/blob/v0.12.0.x/src/primitives/transaction.h#L144-L155
    };
    const dash = {
      messagePrefix: '\u0019DarkCoin Signed Message:\n',
      bip32: { public: 50221816, private: 50221772 },
      pubKeyHash: 76,
      scriptHash: 16,
      wif: 204,
      dustThreshold: 5460,
    };
    const bip32HDNode = Bitcoin.HDNode.fromSeedHex(bip32Seed, dashTestnet);

    const bip32RootKey = bip32HDNode.toBase58();

    const bip32RootAddress = bip32HDNode.getAddress();

    const pathDashTestnet = "m/44'/1'/0'/0/";
    const pathDashLivenet = "m/44'/5'/0'/0/";
    const rt = [bip32HDNode.derivePath(pathDashTestnet + 0).getAddress()];

    let done = false;
    for (i = 2; limit ? (i < limit) : true; i += 20) {
      for (j = i; j < i + 20; j++) {
        const addy = bip32HDNode.derivePath(pathDashTestnet + j).getAddress();
        const bal = await SDK.Explorer.API.getBalance(addy);
        if (!(bal > 0)) {
          done = true;
          break;
        }
        rt.push(addy);
      }
      if (done) {
        break;
      }
    }
    return resolve(rt);
  }));
};
