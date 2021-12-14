// @todo: this is just a test file, should be removed after it's done (replaced by E2E testing)
const LTOChainListener = require('./dist').default;

async function run() {
  const listener = new LTOChainListener({ shouldRetryStart: true });

  try {
    console.info('Starting the listener: ', listener);
    await listener.start();

    console.info('Started!');
  } catch (error) {
    console.log('There was an error, gracefully exiting...');
  }
}

run();
