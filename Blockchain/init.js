const has = require('../util/has.js');
const { uuid } = require('khal');

// const BSPVDash = require('blockchain-spv-dash');
// depericated (use spv-dash instead) - removed to work around bitcore-lib duplicate issue still present in blockchain-spv-dash

const Promise = require('bluebird');// TODO Performance wise we might want to make Bluebird default for promise everywhere.
const levelup = require('levelup');

const db = levelup('dash.chain', { db: require('memdown') });
const EE2 = require('eventemitter2');
const { misc } = require('khal');

let listOfHeader = [];
let lastTip = null;
const fetchAndAdd = async function (self, startHeight, numberOfBlock) {
  const blockHeaders = await self.Explorer.API.getBlockHeaders(startHeight, numberOfBlock, 1);
  await self.Blockchain.addBlock(blockHeaders);
  console.log(blockHeaders[0].height, blockHeaders[blockHeaders.length - 1].height);
  return startHeight + numberOfBlock;
};
const startSocketConnection = async function (self, config) {
  const emitter = self.Blockchain.emitter;
  const socketURI = (await self.Discover.getSocketCandidate()).URI;
  const socket = require('socket.io-client')(socketURI, {
    reconnect: true,
    'reconnection delay': 500,
  });
  socket.on('connect', () => {
    emitter.emit('socket.connected', socket);
    socket.emit('subscribe', 'inv');
    socket.emit('subscribe', 'sync');
    if (self._config.verbose) console.log('Connected to socket -', socketURI);

    socket.on('block', async (_block) => {
      const blockHash = _block.toString();
      emitter.emit('socket.block', blockHash);
      // if (self._config.verbose) console.log('Received Block', blockHash);
      // Checkout the full block from Explorer (insightAPI)

      if (config.socket.autoAddBlock) {
        self.Explorer.API.getBlock(blockHash).then((block) => {
          if (block) {
            self.Blockchain.addBlock([block]);
          }
        });
      }

      // await self.Blockchain.addBlock(block);
      // let diff =  await self.Blockchain.expectNextDifficulty()
      // console.log('Estimated next diff',diff);
    });
    socket.on('tx', (tx) => {
      emitter.emit('socket.tx', tx);
    });
  });
};
const startFullFetch = async function (self, startingBlockHeight) {
  const genesisHeader = await self.Explorer.API.getBlock(startingBlockHeight);
  self.params.blockchain.genesisHeader = genesisHeader;
  const startHeight = startingBlockHeight + 1;

  self.Blockchain.emitter.once('chain.ready', async () => {
    const processFullFetching = async function (self, startHeight, numberOfBlock) {
      startHeight = await fetchAndAdd(self, startHeight, numberOfBlock);
      if (startHeight < (lastTip.height - numberOfBlock)) {
        await processFullFetching(self, startHeight, numberOfBlock);
      } else {
        // Because multiple blocks might have been created while we start our fullfetch.
        lastTip = await self.Explorer.API.getLastBlock();
        if (startHeight < lastTip.height) {
          await processFullFetching(self, startHeight, (lastTip.height - startHeight) + 1);
        }
        return true;
      }
    };
    await processFullFetching(self, startHeight, 100);
    // console.log(self.Blockchain.chain);
    console.log('chain is ready');
  });
  // const fetchAndAdd:
  return false;
};
const startSmartFetch = async function (self, config) {
  const superblockCycle = 16616;

  // Will return the last nbOfSuperblock from Height
  const lastSuperblocksList = function (_height, nbOfSuperblock) {
    const superblockHeightList = [];

    let superblock = _height - (_height % superblockCycle) + superblockCycle;// next superblock
    while (nbOfSuperblock--) {
      superblock -= superblockCycle;
      superblockHeightList.push(superblock);
    }
    superblockHeightList.sort();

    return superblockHeightList;
  };
  const startingHeight = lastSuperblocksList(lastTip.height, 2)[0];
  await startFullFetch(self, startingHeight);
  return false;
};
const startQuickFetch = async function (self, config) {
  if (!config || !config.hasOwnProperty('numberOfHeadersToFetch')) { throw new Error('Missing config. Error.'); }
  // Fetching last block
  const lastHeight = lastTip.height;
  const blockHeaders = await self.Explorer.API.getBlockHeaders(lastHeight - 1, config.numberOfHeadersToFetch, false);
  if (!blockHeaders || blockHeaders.length < 1) {
    console.log(blockHeaders);
    throw new Error('Missing block. Initialization impossible.');
  }
  blockHeaders.push(lastTip);
  self.params.blockchain.genesisHeader = blockHeaders[0];
  listOfHeader = (blockHeaders.slice(1, blockHeaders.length));
  return true;
};
exports.init = function () {
  const self = this;
  return async function (params) {
    return new Promise((async (resolve, reject) => {
      self.Blockchain.emitter = new EE2();
      const emitter = self.Blockchain.emitter;

      const defaultConfig = require('./config.js');
      const { merge } = require('khal').misc;
      const config = merge(params, defaultConfig);

      // We get the last Block generated.
      lastTip = await self.Explorer.API.getLastBlock();

      if (config.fullFetch) {
        // Then we specifically fetch all block from one to last.
        // 50min for fullFetch on testnet
        // 3hr on livenet
        await startFullFetch(self, 0);
      } else if (config.smartFetch) {
        // Then we fetch using our smart fetching (superblock based)
        // Between 5 and 7 minute on livenet or testnet
        await startSmartFetch(self);
      } else {
        // Then we do a lazy fetching : last X block.
        // Depend on Xblock
        await startQuickFetch(self, config);
      }

      // Set it as a genesis (even if we know it's not the case, that a requirement of BSPVDash.
      // Mind that the height will be wrong and that we won't be able to go before the designated block.
      // If you want, you can look for an alternate way in Blockchain/alternate which have not these limitation.
      const genesisHeader = self.params.blockchain.genesisHeader;
      if (!genesisHeader) { throw new Error('Missing Genesis Header. Dropping init.'); }

      self.params.blockchain.genesisHeader = self.Blockchain._normalizeHeader(genesisHeader);
      if (self._config.verbose) console.log(`Initialized blockchain at block ${genesisHeader.height || 0} (${lastTip.height - (genesisHeader.height || 0)} blocks ago) `);

      // Start Blockchain-spv-dash
      self.Blockchain.chain = new BSPVDash(self.params.blockchain, db, { ignoreCheckpoints: true }); // TODO: get rid of checkpoints
      emitter.emit('chain.ready', true);
      // If provided so, add the list of header inside the blockchain
      if (listOfHeader && listOfHeader.length > 0) {
        console.log('Added ', listOfHeader.length, 'blocks');
        await self.Blockchain.addBlock(listOfHeader);
      }
      if (config.socket.autoConnect) {
        startSocketConnection(self, config);
      }
      if (self._config.verbose) console.log('Blockchain ready \n');
      emitter.emit('ready', true);
      return resolve(true);
    }));
  };
};
