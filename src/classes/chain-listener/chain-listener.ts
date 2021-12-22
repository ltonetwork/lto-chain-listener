import Storage from '../storage';
import PublicNode from '../public-node';

import promiseTimeout from '../../utils/promise-timeout';

export interface ChainListenerOptions {
  processingHeight: number;
  publicNodeURL: string;
  processIntervalInMS: number;
  shouldRetryStart: boolean;
  testingMode: boolean;
}

export interface ChainListenerParams {
  processingHeight?: number;
  publicNodeURL?: string;
  processIntervalInMS?: number;
  shouldRetryStart?: boolean;
  testingMode?: boolean;
}

export default class ChainListener {
  private storage: Storage;
  private publicNode: PublicNode;
  public options: ChainListenerOptions;

  private started: boolean = false;
  private processing: boolean = false;

  constructor(private readonly paramOptions?: ChainListenerParams) {
    this.storage = new Storage();

    this.options = {
      testingMode: false,
      shouldRetryStart: false,
      processIntervalInMS: 5000,
      publicNodeURL: 'https://testnet.lto.network',
      processingHeight: this.storage.getItem('processing_height')
        ? Number(this.storage.getItem('processing_height'))
        : 1,
      ...this.paramOptions,
    };

    this.publicNode = new PublicNode(this.options.publicNodeURL);
  }

  public async start(): Promise<void> {
    try {
      console.info(`chain-listener: starting listener`);

      if (this.started) {
        console.warn(`chain-listener: listener already started`);
        return;
      }

      this.started = true;

      // @todo: test the `process()` flow
      await this.process();
      this.started = true;
    } catch (error) {
      this.started = false;
      this.processing = false;
      console.error(`chain-listener: error starting listener: ${error}`);

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

    console.debug(`chain-listener: blockHeight: ${blockHeight}`);
    console.debug(`chain-listener: processingHeight: ${this.options.processingHeight}`);

    const ranges = this.publicNode.getRangesList(this.options.processingHeight, blockHeight);

    console.debug(`chain-listener: ranges: ${JSON.stringify(ranges)}`);

    for (const range of ranges) {
      console.info(`chain-listener: processing blocks ${range.from} to ${range.to}`);

      const blocks = await this.publicNode.getBlocks(range.from, range.to);

      for (const block of blocks) {
        console.debug(`chain-listener: processing block ${block.height}`, block);
        // for (const transaction of block.transactions) {
        //   // @todo: trigger an event here for each transaction
        // }
      }

      this.storage.setItem('processing_height', range.to);
    }

    this.processing = false;
  }
}
