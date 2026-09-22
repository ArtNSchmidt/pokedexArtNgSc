import type { Cache } from '@pokedex/domain';

/** Espelha o `cache-control: max-age=86400` da PokéAPI (§2.1). */
export const DEFAULT_TTL_SECONDS = 86_400;
export const DEFAULT_MAX_ENTRIES = 2_000;
const MILLISECONDS_PER_SECOND = 1_000;

export interface InMemoryTtlCacheOptions {
  readonly defaultTtlSeconds?: number;
  readonly maxEntries?: number;
  /** Relógio injetável para os testes de expiração. */
  readonly now?: () => number;
}

interface Entry<T> {
  readonly value: T;
  readonly expiresAt: number;
}

/**
 * Implementação em memória da porta `Cache<T>` (ADR-002). Além do TTL, **deduplica requisições em
 * voo**: enquanto um carregamento da chave está pendente, chamadas concorrentes recebem a mesma
 * promessa, não uma segunda ida à rede. O limite de entradas descarta a mais antiga (ordem de
 * inserção do `Map`; regravar uma chave a move para o fim).
 */
export class InMemoryTtlCache<T> implements Cache<T> {
  private readonly entries = new Map<string, Entry<T>>();
  private readonly inFlight = new Map<string, Promise<T>>();
  private readonly defaultTtlSeconds: number;
  private readonly maxEntries: number;
  private readonly now: () => number;

  constructor(options: InMemoryTtlCacheOptions = {}) {
    this.defaultTtlSeconds = options.defaultTtlSeconds ?? DEFAULT_TTL_SECONDS;
    this.maxEntries = Math.max(1, options.maxEntries ?? DEFAULT_MAX_ENTRIES);
    this.now = options.now ?? Date.now;
  }

  async getOrLoad(
    key: string,
    loader: () => Promise<T>,
    ttlSeconds: number = this.defaultTtlSeconds,
  ): Promise<T> {
    const fresh = this.readFresh(key);
    if (fresh !== undefined) return fresh.value;

    const pending = this.inFlight.get(key);
    if (pending !== undefined) return pending;

    const loading = this.loadAndStore(key, loader, ttlSeconds);
    this.inFlight.set(key, loading);
    try {
      return await loading;
    } finally {
      this.inFlight.delete(key);
    }
  }

  size(): number {
    return this.entries.size;
  }

  private async loadAndStore(
    key: string,
    loader: () => Promise<T>,
    ttlSeconds: number,
  ): Promise<T> {
    const value = await loader();
    this.store(key, value, ttlSeconds);
    return value;
  }

  /** Embrulha em objeto para distinguir "ausente" de um `T` que por acaso seja `undefined`. */
  private readFresh(key: string): { value: T } | undefined {
    const entry = this.entries.get(key);
    if (entry === undefined) return undefined;
    if (entry.expiresAt <= this.now()) {
      this.entries.delete(key);
      return undefined;
    }
    return { value: entry.value };
  }

  private store(key: string, value: T, ttlSeconds: number): void {
    this.entries.delete(key);
    if (this.entries.size >= this.maxEntries) this.evictOldest();
    this.entries.set(key, { value, expiresAt: this.now() + ttlSeconds * MILLISECONDS_PER_SECOND });
  }

  private evictOldest(): void {
    const oldest = this.entries.keys().next();
    if (!oldest.done) this.entries.delete(oldest.value);
  }
}
