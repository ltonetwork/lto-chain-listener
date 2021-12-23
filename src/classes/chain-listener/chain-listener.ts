import { EventEmitter } from 'events';

import Logger from '../logger';
import Storage from '../storage';
import PublicNode from '../public-node';

import promiseTimeout from '../../utils/promise-timeout';

export interface ChainListenerOptions {
  processingHeight: number;
  publicNodeURL: string;
  processIntervalInMS: number;
  shouldRetryStart: boolean;
  testingMode: boolean;
  logLevel: 'error' | 'warn' | 'info' | 'debug';
}

export interface ChainListenerParams {
  processingHeight?: number;
  publicNodeURL?: string;
  processIntervalInMS?: number;
  shouldRetryStart?: boolean;
  testingMode?: boolean;
  logLevel?: 'error' | 'warn' | 'info' | 'debug';
}

export default class ChainListener extends EventEmitter {
  private logger: Logger;
  private storage: Storage;
  private publicNode: PublicNode;
  private started: boolean = false;
  private processing: boolean = false;

  public options: ChainListenerOptions;

  constructor(private readonly paramOptions?: ChainListenerParams) {
    super();

    this.storage = new Storage();

    this.options = {
      logLevel: 'info',
      testingMode: false,
      shouldRetryStart: false,
      processIntervalInMS: 5000,
      publicNodeURL: 'https://testnet.lto.network',
      processingHeight: this.storage.getItem('processing_height')
        ? Number(this.storage.getItem('processing_height'))
        : 1,
      ...this.paramOptions,
    };

    this.logger = new Logger({ level: this.options.logLevel });
    this.publicNode = new PublicNode(this.options.publicNodeURL);
  }

  public async start(): Promise<void> {
    try {
      this.logger.info(`chain-listener: starting listener`);

      if (this.started) {
        this.logger.warn(`chain-listener: listener already started`);
        return;
      }

      this.started = true;

      await this.process();
      this.started = true;
    } catch (error) {
      this.started = false;
      this.processing = false;
      this.logger.error(`chain-listener: error starting listener: ${error}`);

      if (this.options.shouldRetryStart === true) {
        await promiseTimeout(this.options.processIntervalInMS);
        return this.start();
      } else {
        throw error;
      }
    }
  }

  private async process(): Promise<void> {
    if (!this.processing) {
      await this.checkNewBlocks();
    }

    // maybe find a better alternative to avoid infinite loop while running tests?
    // when running tests, we don't want processing to be endless, but only run once
    if (!this.options.testingMode) {
      await promiseTimeout(this.options.processIntervalInMS);

      return this.process();
    }
  }

  private async checkNewBlocks(): Promise<void> {
    this.processing = true;

    const blockHeight = await this.publicNode.getLastBlockHeight();
    const ranges = this.publicNode.getRangesList(this.options.processingHeight, blockHeight);

    this.logger.debug(`chain-listener: last block height ${blockHeight}`);

    for (const range of ranges) {
      this.logger.info(`chain-listener: processing blocks ${range.from} to ${range.to}`);

      const blocks = await this.publicNode.getBlocks(range.from, range.to);

      for (const block of blocks) {
        this.logger.debug(`chain-listener: processing block`, block);

        for (const transaction of block.transactions) {
          this.logger.debug(`chain-listener: new transaction`, transaction);
          this.emit('new-transaction', transaction);
        }
      }

      this.storage.setItem('processing_height', range.to);
    }

    this.processing = false;
  }
}
