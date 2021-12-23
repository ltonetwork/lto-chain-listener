import axios, { AxiosResponse } from 'axios';

export interface Transaction {
  type: number;
  version: number;
  id: string;
  sender: string;
  senderKeyType: string;
  senderPublicKey: string;
  sponsor?: string;
  sponsorKeyType?: string;
  sponsorPublicKey?: string;
  fee: number;
  timestamp: number;
  associationType?: number;
  recipient: string;
  proofs: string[];
}

export interface BlockHeightResponse {
  height: number;
}

export interface BlockRangeResponse {
  height: number;
  transactions: Transaction[];
}

export default class PublicNode {
  constructor(private readonly nodeUrl: string) {}

  public async getLastBlockHeight(): Promise<number> {
    const response: AxiosResponse<BlockHeightResponse> = await axios.get(`${this.nodeUrl}/blocks/last`);

    if (response.status != 200) {
      return Promise.reject({
        message: 'Error fetching last block from node',
        response,
      });
    }

    return response.data.height;
  }

  public getRangesList(from: number, to: number): Array<{ from: number; to: number }> {
    const ranges = [];

    if (from === to) {
      ranges.push({ from, to });
    }

    // public node doesn't allow getting more than 100 blocks at a time
    for (let start = from; start < to; start += 100) {
      const range = start + 99;
      const max = range > to ? to : range;

      ranges.push({ from: start, to: max });
    }

    return ranges;
  }

  public async getBlocks(from: number, to: number): Promise<BlockRangeResponse[]> {
    const ranges = this.getRangesList(from, to);

    const promises = ranges.map((eachRange) => {
      return this.getBlocksFromRange(eachRange.from, eachRange.to);
    });

    const responses = await Promise.all(promises);

    return responses.flat().sort((a, b) => a.height - b.height);
  }

  private async getBlocksFromRange(from: number, to: number): Promise<BlockRangeResponse> {
    const response: AxiosResponse<BlockRangeResponse> = await axios.get(`${this.nodeUrl}/blocks/seq/${from}/${to}`);

    if (response.status != 200) {
      return Promise.reject({
        message: `Error fetching blocks from range: ${from} to ${to}`,
        response,
      });
    }

    return Promise.resolve(response.data);
  }
}
