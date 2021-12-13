import { PublicNode } from './classes';
import { promiseTimeout } from './utils';

export class LTOChainListener {
  private publicNode: PublicNode;

  private lastBlock: number = 0;
  private started: boolean = false;
  private processing: boolean = false;

  constructor(private readonly startingBlock: string = 'last', private readonly processIntervalInMS: number = 2000) {
    // @todo: get node url from config or env variable
    this.publicNode = new PublicNode('https://testnet.lto.network');
  }

  async start(): Promise<void> {
    try {
      console.info(`chain-listener: starting listener`);

      if (this.started) {
        return console.warn(`chain-listener: listener already started`);
      }

      if (this.startingBlock === 'last') {
        this.lastBlock = await this.publicNode.getLastBlockHeight();
      }

      // @todo: do the processing (check indexer code)
      await this.process();
      this.started = true;
    } catch (error) {
      this.started = false;
      this.processing = false;
      console.error(`chain-listener: error starting listener: ${error}`);

      // @todo: wait for a determined amount of time before starting again
      await promiseTimeout(this.processIntervalInMS);
      return this.start();
    }
  }

  async process(): Promise<void> {
    if (!this.processing) {
      // @todo: make the checkNewBlocks() method
      // await this.checkNewBlocks();
    }

    // @todo: wait for a determined amount of time before processing again
    // await promiseTimeout(this.processIntervalInMS)
    // return this.process();
  }
}
