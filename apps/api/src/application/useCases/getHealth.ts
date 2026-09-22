import type { Health } from '@pokedex/contracts';
import type { PokemonRepository } from '@pokedex/domain';

export type GetHealth = () => Health;

/** `indexSize` zero significa que o índice (ADR-003) ainda não carregou. */
export function createGetHealth(repository: PokemonRepository): GetHealth {
  return () => ({ status: 'ok', indexSize: repository.indexSize() });
}
