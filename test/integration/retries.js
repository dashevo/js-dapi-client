const DAPIClient = require('../../src');

describe('retries', function test() {
  this.timeout(0);

  it('should retry', async () => {
    const client = new DAPIClient({
      seeds: [
        { service: '54.188.88.39' }
      ],
    })

    for (let i = 0; i < 1000; i++) {
      const blockHash = await client.getBestBlockHash();

      console.log(blockHash);
    }
  });
});
