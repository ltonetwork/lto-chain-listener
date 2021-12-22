import Storage from '../storage';
import PublicNode from '../public-node';
import promiseTimeout from '../../utils/promise-timeout';

export interface ChainListenerOptions {
  startingBlock: string | number;
  publicNodeURL: string;
  processIntervalInMS: number;
  shouldRetryStart: boolean;
  testingMode: boolean;
}

export interface ChainListenerParams {
  startingBlock?: string | number;
  publicNodeURL?: string;
  processIntervalInMS?: number;
  shouldRetryStart?: boolean;
  testingMode?: boolean;
}

export default class ChainListener {
  private storage: Storage;
  private publicNode: PublicNode;
  public options: ChainListenerOptions;

  private lastBlock: number = 0;
  private started: boolean = false;
  private processing: boolean = false;

  constructor(private readonly paramOptions?: ChainListenerParams) {
    this.options = {
      startingBlock: 'last',
      publicNodeURL: 'https://testnet.lto.network',
      processIntervalInMS: 5000,
      shouldRetryStart: false,
      testingMode: false,
      ...this.paramOptions,
    };

    this.storage = new Storage();
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

      if (this.options.startingBlock === 'last') {
        this.lastBlock = await this.publicNode.getLastBlockHeight();
      } else {
        this.lastBlock = Number(this.options.startingBlock);
      }

      // @todo: unit test the processing
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

  // @todo: finish this method
  private async checkNewBlocks(): Promise<void> {
    this.processing = true;

    const blockHeight = await this.publicNode.getLastBlockHeight();
    const processingHeight = (await this.storage.get('processing_height')) || this.lastBlock;

    // @todo: remove these debug logs
    console.debug(`chain-listener: blockHeight: ${blockHeight}`);
    console.debug(`chain-listener: processingHeight: ${processingHeight}`);

    // @todo: make getBlockRanges
    // const ranges = this.publicNode.getBlockRanges(processingHeight, blockHeight);

    // for (const range of ranges) {
    //   console.info(`chain-listener: processing blocks ${range.from} to ${range.to}`);
    //   // @todo: make getBlocks
    //   const blocks = await this.publicNode.getBlocks(range.from, range.to);

    //   for (const block of blocks) {
    //     // @todo: make processBlock
    //     await this.processBlock(block);
    //   }

    //   await this.storage.put('processing_height', range.to);
    // }

    this.processing = false;
  }
}
