import { AsyncStorageEngine } from './symbols';

export class SimpleAsyncStorageEngine implements AsyncStorageEngine {
  constructor(private storage: Storage) {}

  async length(): Promise<number> {
    return this.storage.length;
  }
  async getItem(key: string): Promise<any> {
    return this.storage.getItem(key);
  }
  async setItem(key: string, val: any): Promise<void> {
    return this.storage.setItem(key, val);
  }
  async removeItem(key: string): Promise<void> {
    return this.storage.removeItem(key);
  }
  async clear() {
    return this.storage.clear();
  }
}
