import type {
  GenerationOption,
  ListQuery,
  PokemonDetail,
  PokemonListPage,
  TypeOption,
} from '@pokedex/contracts';

/**
 * Porta de cache (ADR-002), tipada por instância: um cache por recurso (Pokémon, espécie, cadeia…)
 * dispensa qualquer cast na leitura. Duas chamadas concorrentes à mesma chave devem compartilhar o
 * mesmo carregamento — é isso que protege a fair use policy da PokéAPI.
 */
export interface Cache<T> {
  getOrLoad(key: string, loader: () => Promise<T>, ttlSeconds?: number): Promise<T>;
  size(): number;
}

/**
 * Porta de leitura da Pokédex (ADR-006). Os casos de uso dependem desta interface; quem fala com
 * `pokeapi.co` é a implementação em `apps/api/src/infrastructure`.
 */
export interface PokemonRepository {
  listPokemon(query: ListQuery): Promise<PokemonListPage>;
  getPokemonDetail(idOrName: string): Promise<PokemonDetail>;
  listTypes(): Promise<TypeOption[]>;
  listGenerations(): Promise<GenerationOption[]>;
  indexSize(): number;
}
