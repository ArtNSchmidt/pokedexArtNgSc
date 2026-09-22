import { describe, expect, it } from 'vitest';
import { paginate } from './pagination.js';

const pokedex = Array.from({ length: 1025 }, (_, index) => index + 1);

describe('paginate (ADR-003)', () => {
  it('primeira página de 24 sobre 1.025 itens', () => {
    const page = paginate(pokedex, 1, 24);

    expect(page.items).toHaveLength(24);
    expect(page.items[0]).toBe(1);
    expect(page.total).toBe(1025);
    expect(page.totalPages).toBe(43);
  });

  it('última página fica com o resto', () => {
    const page = paginate(pokedex, 43, 24);

    expect(page.items).toHaveLength(17);
    expect(page.items.at(-1)).toBe(1025);
  });

  it('página além do fim devolve itens vazios mantendo page e total', () => {
    const page = paginate(pokedex, 99, 24);

    expect(page.items).toEqual([]);
    expect(page.page).toBe(99);
    expect(page.total).toBe(1025);
  });

  it('lista vazia tem zero páginas', () => {
    expect(paginate([], 1, 24)).toEqual({
      items: [],
      page: 1,
      pageSize: 24,
      total: 0,
      totalPages: 0,
    });
  });

  it('é total: page e pageSize abaixo de 1 saturam em 1', () => {
    const page = paginate(pokedex, 0, 0);

    expect(page.page).toBe(1);
    expect(page.pageSize).toBe(1);
    expect(page.items).toEqual([1]);
  });

  it('é total: NaN e Infinity saturam em 1 (JSON com page null seria mentira)', () => {
    expect(paginate(pokedex, Number.NaN, Number.NaN)).toMatchObject({ page: 1, pageSize: 1 });
    expect(paginate(pokedex, Number.POSITIVE_INFINITY, 24)).toMatchObject({
      page: 1,
      pageSize: 24,
    });
  });
});
