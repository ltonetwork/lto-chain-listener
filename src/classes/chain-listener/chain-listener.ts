import PublicNode from '../public-node';
import promiseTimeout from '../../utils/promise-timeout';

export interface ChainListenerOptions {
  startingBlock: string | number;
  publicNodeURL: string;
  processIntervalInMS: number;
  shouldRetryStart: boolean;
}

export interface ChainListenerParams {
  startingBlock?: string | number;
  publicNodeURL?: string;
  processIntervalInMS?: number;
  shouldRetryStart?: boolean;
}

export default class LTOChainListener {
  private publicNode: PublicNode;
  public options: ChainListenerOptions;

  private lastBlock: number = 0;
  private started: boolean = false;
  private processing: boolean = false;

  constructor(private readonly paramOptions?: ChainListenerParams) {
    this.options = {
      startingBlock: 'last',
      publicNodeURL: 'https://testnet.lto.network',
      processIntervalInMS: 2000,
      shouldRetryStart: false,
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

      if (this.options.startingBlock === 'last') {
        this.lastBlock = await this.publicNode.getLastBlockHeight();
      } else {
        this.lastBlock = Number(this.options.startingBlock);
      }

      // @todo: do the processing (check indexer code)
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
      // @todo: make the checkNewBlocks() method
      // await this.checkNewBlocks();
    }

    // @todo: wait for a determined amount of time before processing again
    // await promiseTimeout(this.processIntervalInMS)
    // return this.process();
  }
}
