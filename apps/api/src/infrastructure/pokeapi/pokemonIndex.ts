import { POKEDEX_FIRST_ID, POKEDEX_LAST_ID } from '@pokedex/contracts';
import { normalizeForSearch, searchByName } from '@pokedex/domain';
import type { JsonHttpClient } from '../http/pokeApiClient.js';
import { resourceListDtoSchema } from './schemas.js';
import { fetchParsed } from './upstream.js';

export interface IndexEntry {
  readonly id: number;
  readonly name: string;
  readonly normalizedName: string;
}

/** Uma página só com a Pokédex nacional inteira (93 KB, ~0,3 s), medida em §2.2. */
export const POKEMON_INDEX_PATH = `/pokemon?limit=${String(POKEDEX_LAST_ID)}&offset=0`;

/**
 * Índice em memória da Pokédex nacional (ADR-003). Carregado no bootstrap e, se isso falhar,
 * na primeira requisição: chamadas concorrentes esperam o mesmo carregamento e uma falha não
 * fica cacheada. Busca e paginação são operações locais.
 */
export class PokemonIndex {
  private entries: readonly IndexEntry[] = [];
  private loading: Promise<void> | null = null;

  constructor(private readonly client: JsonHttpClient) {}

  async ensureLoaded(): Promise<void> {
    if (this.entries.length > 0) return;
    this.loading ??= this.load().finally(() => {
      this.loading = null;
    });
    await this.loading;
  }

  size(): number {
    return this.entries.length;
  }

  all(): readonly IndexEntry[] {
    return this.entries;
  }

  search(term: string): IndexEntry[] {
    return searchByName(this.entries, term);
  }

  private async load(): Promise<void> {
    const list = await fetchParsed(this.client, POKEMON_INDEX_PATH, resourceListDtoSchema);
    this.entries = list.results
      .filter((resource) => resource.id >= POKEDEX_FIRST_ID && resource.id <= POKEDEX_LAST_ID)
      .map((resource) => ({
        id: resource.id,
        name: resource.name,
        normalizedName: normalizeForSearch(resource.name),
      }))
      .sort((a, b) => a.id - b.id);
  }
}
