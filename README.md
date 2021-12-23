![github-banner](https://user-images.githubusercontent.com/100821/108692834-6a115200-74fd-11eb-92df-ee07bf62b386.png)

# LTO Public Chain Listener

Listen to the public chain transactions of LTO Network

## Quick Start

To listen to each transaction event, import the `LTOChainListener` and call `start()`:

```js
import LTOChainListener from 'lto-chain-listener';
// OR
const LTOChainListener = require('lto-chain-listener').default; // `.default` for CommonJS

const listener = new LTOChainListener(...options); // see available options below

// for now, the only event emitted is `new-transaction`
listener.on('new-transaction', (transaction) => {
  console.log('We have a new transaction!', transaction);
});

try {
  listener.start();
} catch (error) {
  // something bad happened, you can handle error here
}
```

### - Options

The `LTOChainListener` accepts a few options for different behaviors. See the table below for reference:

| property              | description                                                                                                 | format                             | default value                                                                  |
| --------------------- | ----------------------------------------------------------------------------------------------------------- | ---------------------------------- | ------------------------------------------------------------------------------ |
| `processingHeight`    | The height the listener should start processing                                                             | `Number`                           | The value in local storage (`localStorage.getItem('processingHeight')`) or `1` |
| `publicNodeURL`       | The public node URL the listener should get data from                                                       | `String`                           | `https://testnet.lto.network`                                                  |
| `processIntervalInMS` | The interval between each request made to the public node                                                   | `Number` (in milisseconds)         | `5000`                                                                         |
| `shouldRetryStart`    | Whether or not the listener should retry starting if it fails                                               | `Boolean`                          | `false`                                                                        |
| `testingMode`         | Whether or not the listener should run on testing mode (runs only once instead of listening for new blocks) | `Boolean`                          | `false`                                                                        |
| `logLevel`            | The level of logging on the listener                                                                        | `info`, `error`, `warn` or `debug` | `info`                                                                         |

You can define these options as the following:

```js
new LTOChainListener({
  processingHeight: 100,
  publicNodeURL: 'some-node-url',
  processIntervalInMS: 2000,
  shouldRetryStart: false,
  testingMode: true,
  logLevel: 'debug',
});
```

### - Events

The chain listener emits events while it's processing blocks. For now, the only event emitted is `new-transaction`. You can listen to this event and run whichever code you want when a new transaction is found.

```js
listener.on('new-transaction', (transaction) => {
  console.log('We have a new transaction!', transaction);
});

listener.start();
```

**Note:** it's important to run `listener.start()` only AFTER you create your listeners, otherwise they won't work properly

```js
listener.start();

listener.on('new-transaction', (transaction) => {
  // this will not work, as it is created after `listener.start()`
});
```
