import type { PokemonDetail } from '@pokedex/contracts';
import type { PokemonRepository } from '@pokedex/domain';

export type GetPokemonDetail = (idOrName: string) => Promise<PokemonDetail>;

/** Detalhe completo por id ou slug; `PokemonNotFoundError` sobe até o error handler. */
export function createGetPokemonDetail(repository: PokemonRepository): GetPokemonDetail {
  return (idOrName) => repository.getPokemonDetail(idOrName);
}
