import { listQuerySchema } from '@pokedex/contracts';
import { PokemonNotFoundError } from '@pokedex/domain';
import { beforeEach, describe, expect, it } from 'vitest';
import { createRepositoryCaches } from '../cache/repositoryCaches.js';
import { FakeJsonHttpClient } from './__fixtures__/fakeJsonHttpClient.js';
import { PokeApiPokemonRepository } from './pokeApiPokemonRepository.js';
import { PokemonIndex } from './pokemonIndex.js';

const query = (raw: Record<string, string>) => listQuerySchema.parse(raw);

describe('PokeApiPokemonRepository', () => {
  let client: FakeJsonHttpClient;
  let repository: PokeApiPokemonRepository;

  beforeEach(() => {
    client = new FakeJsonHttpClient();
    repository = new PokeApiPokemonRepository({
      client,
      index: new PokemonIndex(client),
      caches: createRepositoryCaches(),
    });
  });

  describe('listPokemon', () => {
    it('primeira página sem filtros: 24 de 1.025, ordenada por id', async () => {
      const page = await repository.listPokemon(query({}));

      expect(page).toMatchObject({ page: 1, pageSize: 24, total: 1025, totalPages: 43 });
      expect(page.items).toHaveLength(24);
      expect(page.items[0]).toMatchObject({ id: 1, name: 'bulbasaur', types: ['grass', 'poison'] });
    });

    it('filtro por geração: 151 (gabarito de §10.3)', async () => {
      const page = await repository.listPokemon(
        query({ generation: 'generation-i', pageSize: '3' }),
      );

      expect(page.total).toBe(151);
      expect(page.items.map((item) => item.id)).toEqual([1, 2, 3]);
    });

    it('busca e tipo se aplicam como interseção (§6.1)', async () => {
      const page = await repository.listPokemon(query({ q: 'saur', type: 'grass' }));

      expect(page.items.map((item) => item.id)).toEqual([1, 2, 3]);
      expect(page.total).toBe(3);
    });

    it('busca sem resultado devolve página vazia com total 0', async () => {
      const page = await repository.listPokemon(query({ q: 'missingno' }));

      expect(page).toEqual({ items: [], page: 1, pageSize: 24, total: 0, totalPages: 0 });
    });

    it('carrega o índice uma vez e cacheia os Pokémon da página', async () => {
      await repository.listPokemon(query({ pageSize: '2' }));
      await repository.listPokemon(query({ pageSize: '2' }));

      expect(client.callsTo('/pokemon?limit=1025&offset=0')).toBe(1);
      expect(client.callsTo('/pokemon/1')).toBe(1);
    });
  });

  describe('getPokemonDetail', () => {
    it('charizard: agrega os 6 endpoints e devolve o detalhe do contrato', async () => {
      const detail = await repository.getPokemonDetail('charizard');

      expect(detail.weaknesses[0]).toEqual({ type: 'rock', multiplier: 4 });
      expect(detail.weaknesses).toHaveLength(10);
      expect(detail.evolution).toHaveLength(2);
      expect(detail.evolutionStages.map((stage) => stage.species)).toEqual([
        'charmander',
        'charmeleon',
        'charizard',
      ]);
      expect(detail.evolutionStages[2]?.pokemon.name).toBe('charizard');
      expect(detail.abilities.map((ability) => ability.name)).toEqual(['blaze', 'solar-power']);
    });

    it('cacheia espécie, habilidades e relações de dano: a segunda visita não vai à rede', async () => {
      await repository.getPokemonDetail('charizard');
      const callsAfterFirst = client.calls.length;
      await repository.getPokemonDetail('charizard');

      expect(client.callsTo('/pokemon-species/6')).toBe(1);
      expect(client.callsTo('/type/rock')).toBe(1);
      expect(client.calls.length).toBe(callsAfterFirst);
    });

    it('deoxys-normal: a espécie vem do id em species.url (§2.3.4)', async () => {
      const detail = await repository.getPokemonDetail('deoxys-normal');

      expect(detail.name).toBe('deoxys-normal');
      expect(detail.isMythical).toBe(true);
      expect(client.callsTo('/pokemon-species/386')).toBe(1);
    });

    it('404 do upstream vira PokemonNotFoundError', async () => {
      await expect(repository.getPokemonDetail('missingno')).rejects.toBeInstanceOf(
        PokemonNotFoundError,
      );
    });

    it('forma alternativa (id ≥ 10001) é tratada como não encontrada (§2.3.2)', async () => {
      await expect(repository.getPokemonDetail('10001')).rejects.toBeInstanceOf(
        PokemonNotFoundError,
      );
    });
  });

  describe('catálogos', () => {
    it('listTypes devolve os 18 canônicos com rótulo PT-BR', async () => {
      const types = await repository.listTypes();

      expect(types).toHaveLength(18);
      expect(types[0]).toEqual({ name: 'normal', displayName: 'Normal' });
      expect(types.some((type) => type.name === 'fire' && type.displayName === 'Fogo')).toBe(true);
    });

    it('listGenerations devolve as 9 com região', async () => {
      const generations = await repository.listGenerations();

      expect(generations).toHaveLength(9);
      expect(generations[0]).toEqual({
        name: 'generation-i',
        displayName: 'Geração I',
        region: 'Kanto',
      });
    });
  });
});
