import type { Cache } from '@pokedex/domain';
import type {
  AbilityDto,
  EvolutionChainDto,
  GenerationDto,
  PokemonDto,
  ResourceListDto,
  SpeciesDto,
  TypeDto,
} from '../pokeapi/schemas.js';
import { InMemoryTtlCache, type InMemoryTtlCacheOptions } from './inMemoryTtlCache.js';

/** Um cache tipado por recurso da PokéAPI (ver `Cache<T>` em `@pokedex/domain`). */
export interface RepositoryCaches {
  readonly pokemon: Cache<PokemonDto>;
  readonly species: Cache<SpeciesDto>;
  readonly chains: Cache<EvolutionChainDto>;
  readonly abilities: Cache<AbilityDto>;
  readonly types: Cache<TypeDto>;
  readonly generations: Cache<GenerationDto>;
  readonly lists: Cache<ResourceListDto>;
}

/** Fábrica usada pelo composition root; os testes podem passar `now` para controlar a expiração. */
export function createRepositoryCaches(options: InMemoryTtlCacheOptions = {}): RepositoryCaches {
  return {
    pokemon: new InMemoryTtlCache<PokemonDto>(options),
    species: new InMemoryTtlCache<SpeciesDto>(options),
    chains: new InMemoryTtlCache<EvolutionChainDto>(options),
    abilities: new InMemoryTtlCache<AbilityDto>(options),
    types: new InMemoryTtlCache<TypeDto>(options),
    generations: new InMemoryTtlCache<GenerationDto>(options),
    lists: new InMemoryTtlCache<ResourceListDto>(options),
  };
}
