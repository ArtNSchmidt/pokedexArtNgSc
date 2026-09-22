/**
 * Casos de uso (camada de aplicação). Cada um recebe a porta `PokemonRepository` por parâmetro e
 * nunca instancia infraestrutura (§7.6). São finos por natureza: a regra está no domínio e a
 * orquestração de dados no repositório; aqui fica a fronteira que as rotas enxergam.
 */
import type { PokemonRepository } from '@pokedex/domain';
import { createGetHealth, type GetHealth } from './getHealth.js';
import { createGetPokemonDetail, type GetPokemonDetail } from './getPokemonDetail.js';
import { createListGenerations, type ListGenerations } from './listGenerations.js';
import { createListPokemon, type ListPokemon } from './listPokemon.js';
import { createListTypes, type ListTypes } from './listTypes.js';

export interface UseCases {
  readonly listPokemon: ListPokemon;
  readonly getPokemonDetail: GetPokemonDetail;
  readonly listTypes: ListTypes;
  readonly listGenerations: ListGenerations;
  readonly getHealth: GetHealth;
}

export function createUseCases(repository: PokemonRepository): UseCases {
  return {
    listPokemon: createListPokemon(repository),
    getPokemonDetail: createGetPokemonDetail(repository),
    listTypes: createListTypes(repository),
    listGenerations: createListGenerations(repository),
    getHealth: createGetHealth(repository),
  };
}

export type { GetHealth, GetPokemonDetail, ListGenerations, ListPokemon, ListTypes };
