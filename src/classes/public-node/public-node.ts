import axios, { AxiosResponse } from 'axios';

export interface BlockHeightResponse {
  height: number;
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
}
