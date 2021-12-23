import axios, { AxiosResponse } from 'axios';
import PublicNode, { BlockHeightResponse, BlockRangeResponse } from './public-node';

jest.mock('axios');
const mockAxios = axios as jest.Mocked<typeof axios>;

describe('public-node', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getLastBlockHeight()', () => {
    test('should retrieve the last block via HTTP request', async () => {
      const successResponse: AxiosResponse<BlockHeightResponse> = {
        config: {},
        headers: {},
        status: 200,
        statusText: 'status',
        data: {
          height: 123,
        },
      };

      mockAxios.get.mockResolvedValueOnce(successResponse);

      const publicNode = new PublicNode('some-node-url');
      const response = await publicNode.getLastBlockHeight();

      expect(response).toBe(123);
      expect(mockAxios.get).toHaveBeenCalledTimes(1);
    });

    test('should reject when HTTP request returns status != 200', async () => {
      const errorResponse: AxiosResponse<Error> = {
        config: {},
        headers: {},
        status: 500,
        statusText: 'status-error',
        data: new Error('Some bad error'),
      };

      mockAxios.get.mockRejectedValueOnce(errorResponse);

      try {
        const publicNode = new PublicNode('some-node-url');
        await publicNode.getLastBlockHeight();
      } catch (error: any) {
        expect(error.data).toStrictEqual(new Error('Some bad error'));
        expect(mockAxios.get).toHaveBeenCalledTimes(1);
      }
    });
  });

  describe('getRangesList()', () => {
    test('should return a list of ranges between the parameters', () => {
      const publicNode = new PublicNode('some-node-url');

      const ranges = publicNode.getRangesList(1, 500);

      expect(ranges).toStrictEqual([
        { from: 1, to: 100 },
        { from: 101, to: 200 },
        { from: 201, to: 300 },
        { from: 301, to: 400 },
        { from: 401, to: 500 },
      ]);
    });
  });

  describe('getBlocks()', () => {
    test('should get the blocks within the range', async () => {
      const successResponse: AxiosResponse<BlockRangeResponse> = {
        config: {},
        headers: {},
        status: 200,
        statusText: 'status',
        data: {
          height: 123,
          transactions: [],
        },
      };

      mockAxios.get.mockResolvedValue(successResponse);

      const publicNode = new PublicNode('some-node-url');
      const response = await publicNode.getBlocks(1, 500);

      expect(mockAxios.get).toHaveBeenCalledTimes(5);
      expect(response).toStrictEqual([
        { height: 123, transactions: [] },
        { height: 123, transactions: [] },
        { height: 123, transactions: [] },
        { height: 123, transactions: [] },
        { height: 123, transactions: [] },
      ]);
    });
  });
});
