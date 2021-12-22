import { LocalStorage } from 'node-localstorage';

import Storage from './storage';

jest.mock('node-localstorage');

describe('storage', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor()', () => {
    const defaultStorageName = 'lto-chain-listener-storage';

    test('should create a LocalStorage instance with the default storage name', () => {
      new Storage();

      expect(LocalStorage).toHaveBeenCalledTimes(1);
      expect(LocalStorage).toHaveBeenCalledWith(defaultStorageName);
    });

    test('should create a LocalStorage instance with the provided storage name', () => {
      new Storage('some-other-storage-name');

      expect(LocalStorage).toHaveBeenCalledTimes(1);
      expect(LocalStorage).toHaveBeenCalledWith('some-other-storage-name');
    });
  });

  describe('get()', () => {
    test('should return the result from storage', async () => {
      LocalStorage.prototype.getItem = jest.fn().mockImplementation(() => 'some-value');

      const storage = new Storage();
      const result = storage.get('some-key');

      expect(LocalStorage.prototype.getItem).toHaveBeenNthCalledWith(1, 'some-key');
      expect(result).toBe('some-value');
    });

    test('should rethrow errors', async () => {
      LocalStorage.prototype.getItem = jest.fn().mockImplementation(() => {
        throw new Error('some-bad-error');
      });

      try {
        const storage = new Storage();
        storage.get('some-key');
      } catch (error) {
        expect(error).toStrictEqual(new Error('some-bad-error'));
      }
    });
  });

  describe('put()', () => {
    test('should put a value in the storage', async () => {
      LocalStorage.prototype.setItem = jest.fn().mockImplementation(() => {});

      const storage = new Storage();
      storage.put('some-key', 'some-value');

      expect(LocalStorage.prototype.setItem).toHaveBeenNthCalledWith(1, 'some-key', 'some-value');
    });
  });

  describe('del()', () => {
    test('should delete a value from the storage', async () => {
      LocalStorage.prototype.removeItem = jest.fn().mockImplementation(() => {});

      const storage = new Storage();
      storage.del('some-key');

      expect(LocalStorage.prototype.removeItem).toHaveBeenNthCalledWith(1, 'some-key');
    });
  });
});
