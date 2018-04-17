const log = console;

function confirmationPrompt() {
  log.info(`
    **********************************************************************************
    * Now you need your transaction to be confirmed. If you running this code on     *
    * testnet, you need to wait until block will be mined, 2.5 minutes average.      *
    * If you running this code on regtest, you can mine block by executing in        *
    * your terminal following line:                                                  *
    * dash-cli generate 1                                                            *
    * Please press any key after you did this to resume                              *
    **********************************************************************************`);
  return new Promise((resolve) => {
    process.stdin.once('data', () => {
      resolve();
    });
  });
}

module.exports = { confirmationPrompt };
