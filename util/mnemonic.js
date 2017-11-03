const Mnemonic = {
  generateMnemonicAndSeed(lang = 'english', passphrase = '') {
    const bip39 = require('bip39');

    const strenght = 128;
    const rng = null;// random number generator
    const wordlist = bip39.wordlists[lang];

    const mnemonic = bip39.generateMnemonic(strenght, rng, wordlist);
    const valid = bip39.validateMnemonic(mnemonic);
    if (!valid) { return Error('Invalid mnemonic!'); }
    const entropy = bip39.mnemonicToEntropy(mnemonic);
    const seed = bip39.mnemonicToSeedHex(mnemonic, passphrase);

    return {
      bits: strenght,
      language: lang,
      seed,
      entropy,
      phrase: mnemonic,
      passphrase,

    };
  },
  generateSeedFromMnemonic(mnemonic, passphrase = '') {
    const bip39 = require('bip39');
    const seed = bip39.mnemonicToSeedHex(mnemonic, passphrase);
    return seed;// return HEX seed
  },
};
module.exports = Mnemonic;
