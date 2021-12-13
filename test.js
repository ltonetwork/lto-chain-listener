// @todo: this is just a test file, should be removed after it's done (replaced by E2E testing)
const LTO = require('./dist/lto-chain-listener');

async function run() {
  const listener = new LTO.LTOChainListener();

  console.log('Listener: ', listener);

  await listener.start();

  console.log('Started!');
}

run();
