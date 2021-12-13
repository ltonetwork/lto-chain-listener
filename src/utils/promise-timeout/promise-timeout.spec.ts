import { promiseTimeout } from './promise-timeout';

describe('promise-timeout', () => {
  test('should wait for an interval before resolving', async () => {
    // we use at least one second to test, as using milisseconds is not a reliable test
    const before = new Date().getSeconds();
    await promiseTimeout(1000);
    const after = new Date().getSeconds();
    expect(after).toBe(before + 1);
  });
});
