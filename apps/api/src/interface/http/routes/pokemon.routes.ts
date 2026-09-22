import { listQuerySchema, pokemonIdentifierSchema } from '@pokedex/contracts';
import type { FastifyPluginAsync } from 'fastify';
import type { GetPokemonDetail, ListPokemon } from '../../../application/useCases/index.js';
import { parseOrThrow } from '../validation.js';

export interface PokemonRoutesOptions {
  readonly listPokemon: ListPokemon;
  readonly getPokemonDetail: GetPokemonDetail;
}

interface DetailParams {
  readonly idOrName: string;
}

/** Rota não faz regra: valida a entrada, chama o caso de uso, responde (§7.6). */
export const pokemonRoutes: FastifyPluginAsync<PokemonRoutesOptions> = (
  app,
  { listPokemon, getPokemonDetail },
) => {
  app.get('/pokemon', (request) => listPokemon(parseOrThrow(listQuerySchema, request.query)));

  app.get<{ Params: DetailParams }>('/pokemon/:idOrName', (request) =>
    getPokemonDetail(parseOrThrow(pokemonIdentifierSchema, request.params.idOrName)),
  );
  return Promise.resolve();
};
