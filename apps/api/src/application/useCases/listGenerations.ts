import type { GenerationOption } from '@pokedex/contracts';
import type { PokemonRepository } from '@pokedex/domain';

export type ListGenerations = () => Promise<GenerationOption[]>;

/** As 9 gerações para o filtro da lista. */
export function createListGenerations(repository: PokemonRepository): ListGenerations {
  return () => repository.listGenerations();
}
