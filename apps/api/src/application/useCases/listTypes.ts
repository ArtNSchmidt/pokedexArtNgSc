import type { TypeOption } from '@pokedex/contracts';
import type { PokemonRepository } from '@pokedex/domain';

export type ListTypes = () => Promise<TypeOption[]>;

/** Os 18 tipos canônicos para o filtro da lista. */
export function createListTypes(repository: PokemonRepository): ListTypes {
  return () => repository.listTypes();
}
