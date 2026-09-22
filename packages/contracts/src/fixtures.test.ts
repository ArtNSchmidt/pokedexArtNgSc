import { describe, expect, it } from 'vitest';
import {
  bulbasaurDetail,
  charizardDetail,
  eeveeDetail,
  emptyListPageFixture,
  listPageFixture,
  sprigatitoDetail,
} from './fixtures.js';
import {
  LIST_DEFAULT_PAGE,
  LIST_DEFAULT_PAGE_SIZE,
  listQuerySchema,
  pokemonDetailSchema,
  pokemonListPageSchema,
  type PokemonDetail,
} from './pokemon.js';

const detailFixtures: readonly (readonly [string, PokemonDetail])[] = [
  ['bulbasaur', bulbasaurDetail],
  ['charizard', charizardDetail],
  ['eevee', eeveeDetail],
  ['sprigatito', sprigatitoDetail],
];

describe('fixtures de detalhe validam contra pokemonDetailSchema', () => {
  it.each(detailFixtures)('%s', (_name, fixture) => {
    const result = pokemonDetailSchema.safeParse(fixture);

    expect(result.success, JSON.stringify(result.error?.issues)).toBe(true);
  });
});

describe('fixtures de lista validam contra pokemonListPageSchema', () => {
  it('primeira página com 24 itens', () => {
    const result = pokemonListPageSchema.safeParse(listPageFixture);

    expect(result.success, JSON.stringify(result.error?.issues)).toBe(true);
    expect(listPageFixture.items).toHaveLength(24);
  });

  it('página vazia', () => {
    expect(pokemonListPageSchema.safeParse(emptyListPageFixture).success).toBe(true);
    expect(emptyListPageFixture.total).toBe(0);
  });
});

describe('charizardDetail reproduz o gabarito de §6.4', () => {
  it('tem as 10 fraquezas, em ordem decrescente de multiplicador e alfabética no empate', () => {
    expect(charizardDetail.weaknesses).toEqual([
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
});

describe('eeveeDetail cobre a ramificação larga', () => {
  it('tem 8 destinos distintos a partir de eevee e 9 estágios', () => {
    const targets = new Set(eeveeDetail.evolution.map((step) => step.to));

    expect(eeveeDetail.evolution.every((step) => step.from === 'eevee')).toBe(true);
    expect(targets.size).toBe(8);
    expect(eeveeDetail.evolutionStages).toHaveLength(9);
  });
});

describe('sprigatitoDetail cobre campos nulos', () => {
  it('habitat é null explícito', () => {
    expect(sprigatitoDetail.habitat).toBeNull();
  });
});

describe('listQuerySchema', () => {
  it('aplica os defaults de §6.1 quando a query está vazia', () => {
    expect(listQuerySchema.parse({})).toEqual({
      page: LIST_DEFAULT_PAGE,
      pageSize: LIST_DEFAULT_PAGE_SIZE,
      q: undefined,
      type: undefined,
      generation: undefined,
    });
  });

  it('converte page e pageSize vindos como texto', () => {
    const parsed = listQuerySchema.parse({ page: '3', pageSize: '12' });

    expect(parsed.page).toBe(3);
    expect(parsed.pageSize).toBe(12);
  });

  it('trata parâmetro vazio ou só com espaços como ausente', () => {
    const parsed = listQuerySchema.parse({ q: '   ', type: '', generation: '' });

    expect(parsed.q).toBeUndefined();
    expect(parsed.type).toBeUndefined();
    expect(parsed.generation).toBeUndefined();
  });

  it('page e pageSize em branco caem no padrão, não em 400', () => {
    const parsed = listQuerySchema.parse({ page: '', pageSize: '  ' });

    expect(parsed.page).toBe(LIST_DEFAULT_PAGE);
    expect(parsed.pageSize).toBe(LIST_DEFAULT_PAGE_SIZE);
  });

  it('apara espaços e aceita q entre 1 e 40 caracteres', () => {
    expect(listQuerySchema.parse({ q: '  pika ' }).q).toBe('pika');
    expect(listQuerySchema.safeParse({ q: 'x'.repeat(41) }).success).toBe(false);
  });

  it.each([
    ['page não numérica', { page: 'abc' }],
    ['page zero', { page: '0' }],
    ['page fracionária', { page: '1.5' }],
    ['pageSize acima de 60', { pageSize: '61' }],
    ['tipo inexistente', { type: 'banana' }],
    ['geração inexistente', { generation: 'generation-x' }],
  ])('rejeita %s', (_label, query) => {
    expect(listQuerySchema.safeParse(query).success).toBe(false);
  });
});
