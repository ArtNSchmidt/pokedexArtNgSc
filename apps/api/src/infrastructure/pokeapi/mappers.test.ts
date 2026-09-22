import { describe, expect, it } from 'vitest';
import { isRecord, loadFixture } from './__fixtures__/fakeJsonHttpClient.js';
import {
  toCanonicalTypeNames,
  toEvolutionChainNode,
  toPokedexIds,
  toPokemonDetail,
  toPokemonSummary,
  toRelationsByType,
  toTypeOptions,
} from './mappers.js';
import {
  abilityDtoSchema,
  evolutionChainDtoSchema,
  generationDtoSchema,
  idFromResourceUrl,
  pokemonDtoSchema,
  resourceListDtoSchema,
  speciesDtoSchema,
  typeDtoSchema,
  type TypeDto,
} from './schemas.js';

const pokemon = (name: string) => pokemonDtoSchema.parse(loadFixture(name));
const species = (name: string) => speciesDtoSchema.parse(loadFixture(name));
const chain = (name: string) => evolutionChainDtoSchema.parse(loadFixture(name));
const ability = (name: string) => abilityDtoSchema.parse(loadFixture(name));

/** `type-relations.json` → 18 `TypeDto` mínimos, como o repositório receberia de `/type/{name}`. */
function allTypeDtos(): TypeDto[] {
  const relations = loadFixture('type-relations');
  if (!isRecord(relations)) throw new Error('fixture inválida');
  return Object.entries(relations).map(([name, damage_relations]) =>
    typeDtoSchema.parse({ name, damage_relations, pokemon: [] }),
  );
}

describe('schemas do upstream aceitam as respostas reais gravadas em 2026-09-22', () => {
  it.each(['pokemon-1', 'pokemon-6', 'pokemon-386'])('%s', (name) => {
    expect(pokemonDtoSchema.safeParse(loadFixture(name)).success).toBe(true);
  });

  it.each(['species-1', 'species-6', 'species-386'])('%s', (name) => {
    expect(speciesDtoSchema.safeParse(loadFixture(name)).success).toBe(true);
  });

  it('cadeias, habilidades, tipo, geração e listas', () => {
    expect(evolutionChainDtoSchema.safeParse(loadFixture('chain-1')).success).toBe(true);
    expect(abilityDtoSchema.safeParse(loadFixture('ability-65')).success).toBe(true);
    expect(typeDtoSchema.safeParse(loadFixture('type-grass')).success).toBe(true);
    expect(generationDtoSchema.safeParse(loadFixture('generation-1')).success).toBe(true);
    expect(resourceListDtoSchema.safeParse(loadFixture('pokemon-index')).success).toBe(true);
  });
});

describe('idFromResourceUrl', () => {
  it.each([
    ['https://pokeapi.co/api/v2/pokemon/25/', 25],
    ['https://pokeapi.co/api/v2/pokemon-species/906', 906],
    ['https://pokeapi.co/api/v2/pokemon/', null],
    ['not-a-url', null],
  ])('%s → %s', (url, expected) => {
    expect(idFromResourceUrl(url)).toBe(expected);
  });
});

describe('toPokemonSummary', () => {
  it('bulbasaur: nome de exibição, tipos por slot, sprite e artwork', () => {
    expect(toPokemonSummary(pokemon('pokemon-1'))).toEqual({
      id: 1,
      name: 'bulbasaur',
      displayName: 'Bulbasaur',
      types: ['grass', 'poison'],
      spriteUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png',
      artworkUrl:
        'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/1.png',
    });
  });

  it('deoxys-normal: o nome é da forma, a espécie vem de species.url (§2.3.4)', () => {
    const dto = pokemon('pokemon-386');

    expect(dto.name).toBe('deoxys-normal');
    expect(dto.species).toMatchObject({ name: 'deoxys', id: 386 });
    expect(toPokemonSummary(dto).displayName).toBe('Deoxys Normal');
  });
});

describe('toCanonicalTypeNames / toPokedexIds', () => {
  it('descarta stellar, unknown e shadow da lista de 21 tipos (§2.3.3)', () => {
    const list = resourceListDtoSchema.parse(loadFixture('type-list'));

    expect(list.results).toHaveLength(21);
    expect(toCanonicalTypeNames(list.results)).toHaveLength(18);
    expect(toTypeOptions(list.results).map((option) => option.name)).toHaveLength(18);
  });

  it('geração I tem 151 espécies e o tipo grass não traz formas com id ≥ 10001 (§2.3.2)', () => {
    const generation = generationDtoSchema.parse(loadFixture('generation-1'));
    const grass = typeDtoSchema.parse(loadFixture('type-grass'));
    const grassIds = toPokedexIds(grass.pokemon.map((entry) => entry.pokemon));

    expect(toPokedexIds(generation.pokemon_species).size).toBe(151);
    expect(grass.pokemon.some((entry) => entry.pokemon.id >= 10001)).toBe(true);
    expect([...grassIds].every((id) => id <= 1025)).toBe(true);
  });
});

describe('toEvolutionChainNode', () => {
  it('traduz chain-1 para o formato do domínio, com ids das espécies', () => {
    const node = toEvolutionChainNode(chain('chain-1').chain);

    expect(node.speciesName).toBe('bulbasaur');
    expect(node.speciesId).toBe(1);
    expect(node.evolvesTo[0]?.conditions[0]).toMatchObject({ trigger: 'level-up', minLevel: 16 });
    expect(node.evolvesTo[0]?.evolvesTo[0]?.speciesName).toBe('venusaur');
  });
});

describe('toPokemonDetail (Charizard, gabarito de §6.4)', () => {
  const detail = toPokemonDetail({
    pokemon: pokemon('pokemon-6'),
    species: species('species-6'),
    chain: chain('chain-2'),
    abilities: new Map([
      ['blaze', ability('ability-66')],
      ['solar-power', ability('ability-94')],
    ]),
    relationsByType: toRelationsByType(allTypeDtos()),
    stages: [],
  });

  it('fraquezas conferem com §6.4', () => {
    expect(detail.weaknesses).toEqual([
      { type: 'rock', multiplier: 4 },
      { type: 'electric', multiplier: 2 },
      { type: 'water', multiplier: 2 },
      { type: 'fairy', multiplier: 0.5 },
      { type: 'fighting', multiplier: 0.5 },
      { type: 'fire', multiplier: 0.5 },
      { type: 'steel', multiplier: 0.5 },
      { type: 'bug', multiplier: 0.25 },
      { type: 'grass', multiplier: 0.25 },
      { type: 'ground', multiplier: 0 },
    ]);
  });

  it('medidas em metros e quilos, com uma casa (Anexo C)', () => {
    expect(detail.heightMeters).toBe(1.7);
    expect(detail.weightKilograms).toBe(90.5);
  });

  it('texto da espécie sanitizado e em inglês (§2.3.6)', () => {
    expect(detail.genus).toBe('Flame Pokémon');
    expect(detail.flavorText).not.toMatch(/[\n\f]/);
    expect(detail.generation).toBe('generation-i');
    expect(detail.habitat).toBe('mountain');
  });

  it('stats na ordem do contrato, habilidades com efeito, evolução achatada', () => {
    expect(detail.stats.map((stat) => stat.name)).toEqual([
      'hp',
      'attack',
      'defense',
      'special-attack',
      'special-defense',
      'speed',
    ]);
    expect(detail.stats[3]).toEqual({ name: 'special-attack', base: 109, effort: 3 });
    expect(detail.abilities).toEqual([
      expect.objectContaining({ name: 'blaze', isHidden: false, displayName: 'Blaze' }),
      expect.objectContaining({ name: 'solar-power', isHidden: true }),
    ]);
    expect(detail.abilities[0]?.shortEffect).toMatch(/Fire moves/);
    expect(detail.evolution).toEqual([
      expect.objectContaining({ from: 'charmander', to: 'charmeleon', minLevel: 16 }),
      expect.objectContaining({ from: 'charmeleon', to: 'charizard', minLevel: 36 }),
    ]);
  });

  it('habilidade sem DTO carregado fica com shortEffect null, não quebra', () => {
    const withoutAbilities = toPokemonDetail({
      pokemon: pokemon('pokemon-6'),
      species: species('species-6'),
      chain: chain('chain-2'),
      abilities: new Map(),
      relationsByType: toRelationsByType(allTypeDtos()),
      stages: [],
    });

    expect(withoutAbilities.abilities.every((entry) => entry.shortEffect === null)).toBe(true);
  });
});
