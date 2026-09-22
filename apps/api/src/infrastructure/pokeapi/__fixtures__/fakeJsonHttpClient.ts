import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PokemonNotFoundError } from '@pokedex/domain';
import type { JsonHttpClient } from '../../http/pokeApiClient.js';

const FIXTURES_DIR = import.meta.dirname;
const POKEMON_BY_ID = /^\/pokemon\/(\d+)$/;
const CHAIN_BY_ID = /^\/evolution-chain\/(\d+)$/;
const TYPE_BY_NAME = /^\/type\/([a-z]+)$/;
const SPRITES_BASE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';
const API_BASE = 'https://pokeapi.co/api/v2';

/** Lê uma resposta gravada da PokéAPI (`__fixtures__/<nome>.json`). */
export function loadFixture(name: string): unknown {
  const raw = readFileSync(join(FIXTURES_DIR, `${name}.json`), 'utf8');
  const parsed: unknown = JSON.parse(raw);
  return parsed;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

type Route = () => unknown;

/**
 * Cliente falso: serve as fixtures gravadas por caminho e registra cada chamada. Para
 * `/pokemon/{id}` e `/evolution-chain/{id}` sem fixture sintetiza DTOs mínimos, o que permite
 * testar listagens e estágios de evolução sem gravar 1.025 arquivos. Caminho desconhecido →
 * `PokemonNotFoundError`, como o cliente real faz com 404.
 */
export class FakeJsonHttpClient implements JsonHttpClient {
  readonly calls: string[] = [];
  private readonly routes = new Map<string, Route>();
  private readonly typeRelations = new Map<string, unknown>();

  constructor() {
    this.route('/pokemon?limit=1025&offset=0', 'pokemon-index');
    this.route('/pokemon/1', 'pokemon-1');
    this.route('/pokemon/bulbasaur', 'pokemon-1');
    this.route('/pokemon/6', 'pokemon-6');
    this.route('/pokemon/charizard', 'pokemon-6');
    this.route('/pokemon/386', 'pokemon-386');
    this.route('/pokemon/deoxys-normal', 'pokemon-386');
    this.route('/pokemon-species/1', 'species-1');
    this.route('/pokemon-species/6', 'species-6');
    this.route('/pokemon-species/386', 'species-386');
    this.route('/evolution-chain/1', 'chain-1');
    this.route('/evolution-chain/2', 'chain-2');
    this.route('/ability/overgrow', 'ability-65');
    this.route('/ability/chlorophyll', 'ability-34');
    this.route('/ability/blaze', 'ability-66');
    this.route('/ability/solar-power', 'ability-94');
    this.route('/ability/pressure', 'ability-pressure');
    this.route('/type/grass', 'type-grass');
    this.route('/generation/generation-i', 'generation-1');
    this.route('/type?limit=100', 'type-list');
    this.route('/generation', 'generation-list');
    this.loadTypeRelations();
  }

  getJson(path: string): Promise<unknown> {
    this.calls.push(path);
    const route = this.routes.get(path);
    if (route !== undefined) return Promise.resolve(route());

    const synthetic = this.synthesize(path);
    if (synthetic !== undefined) return Promise.resolve(synthetic);

    return Promise.reject(new PokemonNotFoundError(path.split('/').at(-1) ?? path));
  }

  callsTo(path: string): number {
    return this.calls.filter((call) => call === path).length;
  }

  private route(path: string, fixture: string): void {
    this.routes.set(path, () => loadFixture(fixture));
  }

  /** `type-relations.json` traz só `damage_relations` dos 18 tipos: vira um `/type/{name}` sem lista de Pokémon. */
  private loadTypeRelations(): void {
    const relations = loadFixture('type-relations');
    if (!isRecord(relations)) return;
    for (const [name, damageRelations] of Object.entries(relations)) {
      this.typeRelations.set(name, { name, damage_relations: damageRelations, pokemon: [] });
    }
  }

  private synthesize(path: string): unknown {
    const type = TYPE_BY_NAME.exec(path)?.[1];
    if (type !== undefined) return this.typeRelations.get(type);

    const pokemonId = POKEMON_BY_ID.exec(path)?.[1];
    if (pokemonId !== undefined) return syntheticPokemon(Number(pokemonId));

    const chainId = CHAIN_BY_ID.exec(path)?.[1];
    if (chainId !== undefined) return syntheticLoneChain(Number(chainId));

    return undefined;
  }
}

function syntheticPokemon(id: number): unknown {
  const name = `pokemon-${String(id)}`;
  const statNames = ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed'];
  return {
    id,
    name,
    height: 10,
    weight: 100,
    base_experience: null,
    types: [{ slot: 1, type: { name: 'normal', url: `${API_BASE}/type/1/` } }],
    stats: statNames.map((stat, index) => ({
      base_stat: 50,
      effort: 0,
      stat: { name: stat, url: `${API_BASE}/stat/${String(index + 1)}/` },
    })),
    abilities: [],
    sprites: {
      front_default: `${SPRITES_BASE}/${String(id)}.png`,
      other: { 'official-artwork': { front_default: null } },
    },
    cries: { latest: null },
    species: { name, url: `${API_BASE}/pokemon-species/${String(id)}/` },
  };
}

/** Cadeia de uma espécie só (não evolui): exercita o caminho `evolution: []`. */
function syntheticLoneChain(id: number): unknown {
  const species = `species-${String(id)}`;
  return {
    id,
    chain: {
      species: { name: species, url: `${API_BASE}/pokemon-species/${String(id)}/` },
      evolution_details: [],
      evolves_to: [],
    },
  };
}
