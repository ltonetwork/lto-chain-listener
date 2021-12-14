import PublicNode from '../public-node';
import LTOChainListener from './chain-listener';

jest.mock('./classes/public-node');

describe('lto-chain-listener', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  function spy() {
    const console = {
      log: jest.spyOn(global.console, 'log'),
      info: jest.spyOn(global.console, 'info'),
      warn: jest.spyOn(global.console, 'warn'),
      error: jest.spyOn(global.console, 'error'),
    };

    return { console };
  }

  describe('constructor()', () => {
    const defaultOptions = {
      startingBlock: 'last',
      publicNodeURL: 'https://testnet.lto.network',
      processIntervalInMS: 2000,
      shouldRetryStart: false,
    };

    test('should have default options if no parameters are sent', () => {
      const listener = new LTOChainListener();

      expect(PublicNode).toHaveBeenCalledTimes(1);
      expect(PublicNode).toHaveBeenCalledWith(defaultOptions.publicNodeURL);

      expect(listener.options).toStrictEqual(defaultOptions);
    });

    test('should override default options with ones from parameters', () => {
      const listener = new LTOChainListener({
        startingBlock: 123,
        publicNodeURL: 'some-other-url',
      });

      expect(PublicNode).toHaveBeenCalledTimes(1);
      expect(PublicNode).toHaveBeenCalledWith('some-other-url');

      expect(listener.options).toStrictEqual({
        ...defaultOptions,
        startingBlock: 123,
        publicNodeURL: 'some-other-url',
      });
    });
  });

  describe('start()', () => {
    test('should log that listener is starting', async () => {
      const spies = spy();
      const listener = new LTOChainListener();

      await listener.start();

      expect(spies.console.info).toHaveBeenNthCalledWith(1, `chain-listener: starting listener`);
    });

    test('should call the public node if starting from last block', async () => {
      const listener = new LTOChainListener();

      await listener.start();

      expect(PublicNode.prototype.getLastBlockHeight).toHaveBeenCalledTimes(1);
    });

    test('should not call the public node if starting from any other block', async () => {
      const listener = new LTOChainListener({ startingBlock: 123 });

      await listener.start();

      expect(PublicNode.prototype.getLastBlockHeight).toHaveBeenCalledTimes(0);
    });

    test('should log warning if listener has already started and not process further', async () => {
      const spies = spy();
      // defaultOptions.startingBlock === 'last'
      const listener = new LTOChainListener();

      await listener.start();
      await listener.start();

      expect(spies.console.warn).toHaveBeenNthCalledWith(1, `chain-listener: listener already started`);
      expect(PublicNode.prototype.getLastBlockHeight).toHaveBeenCalledTimes(1);
    });

    test('should log errors and rethrow', async () => {
      PublicNode.prototype.getLastBlockHeight = jest.fn().mockRejectedValue(new Error('some bad error'));

      const spies = spy();
      const listener = new LTOChainListener();

      try {
        await listener.start();
      } catch (error) {
        expect(error).toStrictEqual(new Error('some bad error'));
        expect(spies.console.error).toHaveBeenNthCalledWith(
          1,
          `chain-listener: error starting listener: Error: some bad error`,
        );
      }
    });
  });
});
