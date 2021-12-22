import Storage from '../storage';
import PublicNode from '../public-node';

import LTOChainListener, { ChainListenerOptions } from './chain-listener';

jest.mock('../storage');
jest.mock('../public-node');

describe('lto-chain-listener', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  function spy() {
    const console = {
      log: jest.spyOn(global.console, 'log').mockImplementation(() => jest.fn()),
      debug: jest.spyOn(global.console, 'debug').mockImplementation(() => jest.fn()),
      info: jest.spyOn(global.console, 'info').mockImplementation(() => jest.fn()),
      warn: jest.spyOn(global.console, 'warn').mockImplementation(() => jest.fn()),
      error: jest.spyOn(global.console, 'error').mockImplementation(() => jest.fn()),
    };

    return { console };
  }

  describe('constructor()', () => {
    const defaultOptions: ChainListenerOptions = {
      testingMode: true,
      shouldRetryStart: false,
      processIntervalInMS: 5000,
      publicNodeURL: 'https://testnet.lto.network',
      processingHeight: 1,
    };

    describe('no parameters set', () => {
      test('should set default options, with processing height from storage', () => {
        Storage.prototype.getItem = jest.fn().mockImplementation(() => '123');

        // `testingMode` must always be true on tests, otherwise they will fail with a timeout
        const listener = new LTOChainListener({ testingMode: true });

        expect(PublicNode).toHaveBeenCalledTimes(1);
        expect(PublicNode).toHaveBeenCalledWith(defaultOptions.publicNodeURL);

        expect(listener.options).toStrictEqual({
          ...defaultOptions,
          processingHeight: 123,
        });
      });

      test('should set default options, even if storage does not have processing height', () => {
        Storage.prototype.getItem = jest.fn().mockImplementation(() => null);

        // `testingMode` must always be true on tests, otherwise they will fail with a timeout
        const listener = new LTOChainListener({ testingMode: true });

        expect(PublicNode).toHaveBeenCalledTimes(1);
        expect(PublicNode).toHaveBeenCalledWith(defaultOptions.publicNodeURL);

        expect(listener.options).toStrictEqual(defaultOptions);
      });
    });

    test('should override default options with ones from parameters', () => {
      const listener = new LTOChainListener({
        processingHeight: 123,
        publicNodeURL: 'some-other-url',
        testingMode: true,
      });

      expect(PublicNode).toHaveBeenCalledTimes(1);
      expect(PublicNode).toHaveBeenCalledWith('some-other-url');

      expect(listener.options).toStrictEqual({
        ...defaultOptions,
        processingHeight: 123,
        publicNodeURL: 'some-other-url',
      });
    });
  });

  describe('start()', () => {
    const mockBlocks = [{ height: 1, transactions: [] }];
    const mockRangesList = [
      { from: 1, to: 99 },
      { from: 100, to: 199 },
    ];

    test('should log that listener is starting', async () => {
      const spies = spy();

      PublicNode.prototype.getBlocks = jest.fn().mockImplementation(() => mockBlocks);
      PublicNode.prototype.getRangesList = jest.fn().mockImplementation(() => mockRangesList);

      const listener = new LTOChainListener({ testingMode: true });

      await listener.start();

      expect(spies.console.info).toHaveBeenNthCalledWith(1, `chain-listener: starting listener`);
      expect(PublicNode.prototype.getLastBlockHeight).toHaveBeenCalledTimes(1);
    });

    test('should log warning if listener has already started and not process further', async () => {
      const spies = spy();

      const listener = new LTOChainListener({ testingMode: true });

      await listener.start();
      await listener.start();

      expect(spies.console.warn).toHaveBeenNthCalledWith(1, `chain-listener: listener already started`);
      expect(PublicNode.prototype.getLastBlockHeight).toHaveBeenCalledTimes(1);
    });

    test('should log errors and rethrow', async () => {
      PublicNode.prototype.getLastBlockHeight = jest.fn().mockRejectedValue(new Error('some bad error'));

      const spies = spy();
      const listener = new LTOChainListener({ testingMode: true });

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
