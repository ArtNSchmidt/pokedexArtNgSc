import { describe, expect, it, vi } from 'vitest';
import { InMemoryTtlCache } from './inMemoryTtlCache.js';

describe('InMemoryTtlCache (ADR-002)', () => {
  it('carrega uma vez e serve do cache nas próximas', async () => {
    const cache = new InMemoryTtlCache<string>();
    const loader = vi.fn(() => Promise.resolve('value'));

    await cache.getOrLoad('k', loader);
    await cache.getOrLoad('k', loader);

    expect(loader).toHaveBeenCalledTimes(1);
    expect(cache.size()).toBe(1);
  });

  it('deduplica requisições em voo: chamadas concorrentes compartilham a promessa', async () => {
    const cache = new InMemoryTtlCache<number>();
    let resolve: (value: number) => void = () => undefined;
    const loader = vi.fn(
      () =>
        new Promise<number>((res) => {
          resolve = res;
        }),
    );

    const first = cache.getOrLoad('k', loader);
    const second = cache.getOrLoad('k', loader);
    resolve(42);

    expect(await Promise.all([first, second])).toEqual([42, 42]);
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it('expira pelo TTL e recarrega', async () => {
    let clock = 0;
    const cache = new InMemoryTtlCache<string>({ defaultTtlSeconds: 10, now: () => clock });
    const loader = vi.fn(() => Promise.resolve('v'));

    await cache.getOrLoad('k', loader);
    clock = 9_999;
    await cache.getOrLoad('k', loader);
    clock = 10_000;
    await cache.getOrLoad('k', loader);

    expect(loader).toHaveBeenCalledTimes(2);
  });

  it('descarta a entrada mais antiga ao passar do limite', async () => {
    const cache = new InMemoryTtlCache<string>({ maxEntries: 2 });
    const loader = vi.fn((key: string) => () => Promise.resolve(key));

    await cache.getOrLoad('a', loader('a'));
    await cache.getOrLoad('b', loader('b'));
    await cache.getOrLoad('c', loader('c'));
    await cache.getOrLoad('a', loader('a'));

    expect(cache.size()).toBe(2);
    expect(loader).toHaveBeenCalledTimes(4);
  });

  it('não cacheia falha: a próxima chamada tenta de novo', async () => {
    const cache = new InMemoryTtlCache<string>();
    const loader = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce('ok');

    await expect(cache.getOrLoad('k', loader)).rejects.toThrow('boom');
    await expect(cache.getOrLoad('k', loader)).resolves.toBe('ok');
    expect(loader).toHaveBeenCalledTimes(2);
  });
});
