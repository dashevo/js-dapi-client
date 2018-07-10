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
    });
}

const selectTest =
{
  type: 'list',
  name: 'selectTest',
  message: 'Choose a test:',
  choices: fs.readdirSync(path.dirname(require.main.filename).concat('/scenarios'))
    .map(f => f.slice(0, -3)),
};

let liveUpdates = false;
function setNewScenario(Scenario) {
  liveUpdates = false;
  process.stdout.write('\x1Bc');
  if (!Scenario) {
    prompt(selectTest)
      .then((answer) => {
        switch (answer.selectTest) {
          case 'chain_status':
            setNewScenario(ChainStatus);
            break;
          case 'tx_watcher':
            setNewScenario(TxWatcher);
            break;
          default:
            break;
        }
      });
  } else {
    if (currScenario) {
      currScenario.clearIntervals();
    }
    currScenario = new Scenario(chain);
    const userInput = currScenario.getInput && currScenario.getInput();
    if (userInput) {
      prompt(userInput)
        .then((answers) => {
          currScenario.answers = answers;
          liveUpdates = true;
        });
    } else {
      liveUpdates = true;
    }
  }
}

process.stdin.on('keypress', (ch, key) => {
  if (key.name === 'escape') {
    setNewScenario(null);
  }
});

initChain()
  .then(() => {
    setNewScenario(null);
    setInterval(() => {
      if (liveUpdates) {
        ui.updateBottomBar(currScenario.getOutput());
      }
      headerCollector();
    }, 1000);
  });

