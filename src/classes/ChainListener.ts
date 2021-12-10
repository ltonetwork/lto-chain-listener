export class ChainListener {
  public processing: boolean = false;
  public lastBlock: number = 0;
  public started: boolean = false;

  // @todo: add options/parameters to the listener class
  constructor() {}

  async start() {
    try {
      console.info(`chain-listener: starting listener`);

      if (this.started) {
        return console.warn(`chain-listener: listener already started`);
      }

      // @todo: get last block (either last block from node or starting block from parameters)
      // this.lastBlock =
      //   this.config.getStartingBlock() === 'last'
      //     ? await this.node.getLastBlockHeight()
      //     : (this.config.getStartingBlock() as number);
    } catch (error) {}
  }
}
