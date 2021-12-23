import Logger from '../logger';
import Storage from '../storage';
import PublicNode from '../public-node';

import LTOChainListener, { ChainListenerOptions } from './chain-listener';

jest.mock('../logger');
jest.mock('../storage');
jest.mock('../public-node');

describe('lto-chain-listener', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor()', () => {
    const defaultOptions: ChainListenerOptions = {
      logLevel: 'info',
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
    const mockBlocks = [{ height: 1, transactions: [{ id: 'tx-1' }, { id: 'tx-2' }] }];
    const mockRangesList = [
      { from: 1, to: 99 },
      { from: 100, to: 199 },
    ];

    beforeEach(() => {
      LTOChainListener.prototype.emit = jest.fn();

      Storage.prototype.setItem = jest.fn();

      PublicNode.prototype.getLastBlockHeight = jest.fn().mockResolvedValue(199);
      PublicNode.prototype.getBlocks = jest.fn().mockImplementation(() => mockBlocks);
      PublicNode.prototype.getRangesList = jest.fn().mockImplementation(() => mockRangesList);
    });

    test('should log that listener is starting', async () => {
      const listener = new LTOChainListener({ testingMode: true });
      await listener.start();

      expect(Logger.prototype.info).toHaveBeenNthCalledWith(1, `chain-listener: starting listener`);
      expect(PublicNode.prototype.getLastBlockHeight).toHaveBeenCalledTimes(1);
    });

    test('should log warning if listener has already started and not process further', async () => {
      const listener = new LTOChainListener({ testingMode: true });

      await listener.start();
      await listener.start();

      expect(Logger.prototype.warn).toHaveBeenNthCalledWith(1, `chain-listener: listener already started`);
      expect(PublicNode.prototype.getLastBlockHeight).toHaveBeenCalledTimes(1);
    });

    test('should log errors and rethrow', async () => {
      PublicNode.prototype.getLastBlockHeight = jest.fn().mockRejectedValue(new Error('some bad error'));
      const listener = new LTOChainListener({ testingMode: true });

      try {
        await listener.start();
      } catch (error) {
        expect(error).toStrictEqual(new Error('some bad error'));
        expect(Logger.prototype.error).toHaveBeenNthCalledWith(
          1,
          `chain-listener: error starting listener: Error: some bad error`,
        );
      }
    });

    test('should process blocks from processing height and fire an event for each transaction', async () => {
      const listener = new LTOChainListener({ testingMode: true });
      await listener.start();

      expect(PublicNode.prototype.getRangesList).toHaveBeenCalledTimes(1);
      expect(PublicNode.prototype.getRangesList).toHaveBeenNthCalledWith(1, 1, 199);

      expect(Logger.prototype.info).toHaveBeenCalledTimes(3);
      expect(Logger.prototype.info).toHaveBeenNthCalledWith(2, 'chain-listener: processing blocks 1 to 99');
      expect(Logger.prototype.info).toHaveBeenNthCalledWith(3, 'chain-listener: processing blocks 100 to 199');

      expect(PublicNode.prototype.getBlocks).toHaveBeenCalledTimes(2);
      expect(PublicNode.prototype.getBlocks).toHaveBeenNthCalledWith(1, 1, 99);
      expect(PublicNode.prototype.getBlocks).toHaveBeenNthCalledWith(2, 100, 199);

      expect(LTOChainListener.prototype.emit).toHaveBeenCalledTimes(4);
      expect(LTOChainListener.prototype.emit).toHaveBeenNthCalledWith(1, 'new-transaction', { id: 'tx-1' });
      expect(LTOChainListener.prototype.emit).toHaveBeenNthCalledWith(2, 'new-transaction', { id: 'tx-2' });
      expect(LTOChainListener.prototype.emit).toHaveBeenNthCalledWith(3, 'new-transaction', { id: 'tx-1' });
      expect(LTOChainListener.prototype.emit).toHaveBeenNthCalledWith(4, 'new-transaction', { id: 'tx-2' });

      expect(Storage.prototype.setItem).toHaveBeenCalledTimes(2);
      expect(Storage.prototype.setItem).toHaveBeenNthCalledWith(1, 'processing_height', 99);
      expect(Storage.prototype.setItem).toHaveBeenNthCalledWith(2, 'processing_height', 199);
    });
  });
});
