import { LocalStorage } from 'node-localstorage';

export default class Storage {
  private storage: LocalStorage;

  constructor(storageName: string = 'lto-chain-listener-storage') {
    this.storage = new LocalStorage(storageName);
  }

  public get(key: string): string | null {
    return this.storage.getItem(key);
  }

  public put(key: string, value: any): void {
    return this.storage.setItem(key, value);
  }

  public del(key: string): void {
    return this.storage.removeItem(key);
  }
}
