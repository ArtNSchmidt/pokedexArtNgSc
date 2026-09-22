import type { ListQuery, PokemonListPage } from '@pokedex/contracts';
import type { PokemonRepository } from '@pokedex/domain';

export type ListPokemon = (query: ListQuery) => Promise<PokemonListPage>;

/** Lista paginada com busca e filtros (§6.1); a query já chega validada pela rota. */
export function createListPokemon(repository: PokemonRepository): ListPokemon {
  return (query) => repository.listPokemon(query);
}
