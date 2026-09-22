/**
 * Learning test (Clean Code, cap. 8): documenta o formato real da PokéAPI e prova que os schemas
 * do adapter o aceitam. Fica em `describe.skip` para o CI continuar offline; para rodar:
 * `pnpm --filter @pokedex/api exec vitest run pokeApi.learning --testNamePattern .` após trocar
 * `describe.skip` por `describe` localmente. Cada recurso é buscado uma única vez (fair use).
 */
import { describe, expect, it } from 'vitest';
import { PokeApiClient } from '../http/pokeApiClient.js';
import { POKEMON_INDEX_PATH } from './pokemonIndex.js';
import { pokemonDtoSchema, resourceListDtoSchema, speciesDtoSchema } from './schemas.js';

describe.skip('PokéAPI real (learning test, requer rede)', () => {
  const client = new PokeApiClient();

  it('/pokemon/1 casa com pokemonDtoSchema', async () => {
    const dto = pokemonDtoSchema.parse(await client.getJson('/pokemon/1'));

    expect(dto.name).toBe('bulbasaur');
    expect(dto.species.id).toBe(1);
  });

  it('/pokemon-species/906 tem habitat null (§2.3.7)', async () => {
    const dto = speciesDtoSchema.parse(await client.getJson('/pokemon-species/906'));

    expect(dto.habitat).toBeNull();
  });

  it('índice tem 1.025 entradas com id ≤ 1025 (§2.3.2)', async () => {
    const list = resourceListDtoSchema.parse(await client.getJson(POKEMON_INDEX_PATH));

    expect(list.results.filter((entry) => entry.id <= 1025)).toHaveLength(1025);
  });
});
