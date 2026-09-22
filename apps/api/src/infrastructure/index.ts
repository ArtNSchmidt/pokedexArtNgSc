/** Superfície pública da infraestrutura para o composition root (`main.ts`, A4). */
export {
  DEFAULT_MAX_ENTRIES,
  DEFAULT_TTL_SECONDS,
  InMemoryTtlCache,
  type InMemoryTtlCacheOptions,
} from './cache/inMemoryTtlCache.js';
export { createRepositoryCaches, type RepositoryCaches } from './cache/repositoryCaches.js';
export {
  POKEAPI_BASE_URL,
  PokeApiClient,
  type FetchFunction,
  type JsonHttpClient,
} from './http/pokeApiClient.js';
export {
  PokeApiPokemonRepository,
  type PokeApiPokemonRepositoryDeps,
} from './pokeapi/pokeApiPokemonRepository.js';
export { PokemonIndex, type IndexEntry } from './pokeapi/pokemonIndex.js';
