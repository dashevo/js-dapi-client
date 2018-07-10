const inquirer = require('inquirer');
const fs = require('fs');

const ui = new inquirer.ui.BottomBar();
const prompt = inquirer.createPromptModule();
const ChainStatus = require('./scenarios/chain_status');
const TxWatcher = require('./scenarios/tx_watcher');
const Api = require('../../src/api');
const { SpvChain } = require('@dashevo/dash-spv');

let currScenario = null;
let checkPointHeight = 0;
let chain = null;

const path = require('path');

const api = new Api();

function initChain() {
  return api.getBestBlockHeight()
    .then((currHeight) => {
      checkPointHeight = currHeight - 20;
      return api.getBlockHeaders(checkPointHeight, 1);
    })
    .then((headerObj) => {
      chain = new SpvChain('custom_genesis', headerObj.headers[0]);
    }).catch(() => {
      // todo logging
    });
}

function headerCollector() {
  api.getBestBlockHeight()
    .then((currHeight) => {
      const deltaHeight = currHeight - (chain.getChainHeight() + checkPointHeight);

      if (deltaHeight > 0) {
        return api.getBlockHeaders(chain.getChainHeight()
          + checkPointHeight + 1, deltaHeight);
      }
      return null;
    }).then((headersObj) => {
      if (headersObj && headersObj.headers.length > 0) {
        chain.addHeaders(headersObj.headers);
      }
    }).catch(() => {
      // todo logging
    });
}

const selectTest =
{
  type: 'list',
  name: 'selectTest',
  message: 'Choose a test:',
  choices: fs.readdirSync(path.dirname(require.main.filename).concat('/scenarios')),
};

const peers = api.MNDiscovery.masternodeListProvider.masternodeList;
function setNewScenario(Scenario) {
  process.stdout.write('\x1Bc');
  if (!Scenario) {
    prompt(selectTest)
      .then((answer) => {
        switch (answer.selectTest) {
          case 'chain_status.js':
            setNewScenario(new ChainStatus(chain, peers));
            break;
          case 'tx_watcher.js':
            setNewScenario(new TxWatcher(api));
            break;
          default:
            break;
        }
      });
  } else {
    if (currScenario) {
      currScenario.clearIntervals();
    }

    const userInput = Scenario.getInput && Scenario.getInput();
    if (userInput) {
      prompt(userInput)
        .then((answers) => {
          Scenario.setAnswers(answers);
          currScenario = Scenario;
        });
    } else {
      currScenario = Scenario;
    }
  }
}

// currScenario = new TxWatcher();
initChain()
  .then(() => {
    setNewScenario(null);
    setInterval(() => {
      if (currScenario) {
        currScenario.init();
        ui.updateBottomBar(currScenario.getOutput());
      }
      headerCollector();
    }, 1000);
  });

