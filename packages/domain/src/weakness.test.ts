import { TYPE_NAMES, type Weakness } from '@pokedex/contracts';
import { describe, expect, it } from 'vitest';
import { TYPE_RELATIONS } from './__fixtures__/typeRelations.js';
import { calculateWeaknesses } from './weakness.js';

const byType = (weaknesses: readonly Weakness[]): Record<string, number> =>
  Object.fromEntries(weaknesses.map((weakness) => [weakness.type, weakness.multiplier]));

describe('calculateWeaknesses (gabarito conferido contra a PokéAPI em 2026-09-22)', () => {
  it('charizard (fire/flying): ×4 em rock, imune a ground, ×¼ em bug e grass', () => {
    const result = calculateWeaknesses(['fire', 'flying'], TYPE_RELATIONS);

    expect(byType(result)).toEqual({
      rock: 4,
      electric: 2,
      water: 2,
      fairy: 0.5,
      fighting: 0.5,
      fire: 0.5,
      steel: 0.5,
      bug: 0.25,
      grass: 0.25,
      ground: 0,
    });
  });

  it('charizard: ordena por multiplicador decrescente e, no empate, por nome (§6.4)', () => {
    const result = calculateWeaknesses(['fire', 'flying'], TYPE_RELATIONS);

    expect(result.map((weakness) => weakness.type)).toEqual([
      'rock',
      'electric',
      'water',
      'fairy',
      'fighting',
      'fire',
      'steel',
      'bug',
      'grass',
      'ground',
    ]);
  });

  it('bulbasaur (grass/poison)', () => {
    expect(byType(calculateWeaknesses(['grass', 'poison'], TYPE_RELATIONS))).toEqual({
      fire: 2,
      flying: 2,
      ice: 2,
      psychic: 2,
      electric: 0.5,
      fairy: 0.5,
      fighting: 0.5,
      water: 0.5,
      grass: 0.25,
    });
  });

  it('sableye (dark/ghost): imunidade tripla, o que quebra implementação que soma', () => {
    expect(byType(calculateWeaknesses(['dark', 'ghost'], TYPE_RELATIONS))).toEqual({
      fairy: 2,
      poison: 0.5,
      fighting: 0,
      normal: 0,
      psychic: 0,
    });
  });

  it.each(TYPE_NAMES)('tipo único %s: nunca produz ×4 nem ×¼', (type) => {
    const multipliers = calculateWeaknesses([type], TYPE_RELATIONS).map((w) => w.multiplier);

    expect(multipliers).not.toContain(4);
    expect(multipliers).not.toContain(0.25);
  });

  it('omite todo tipo com multiplicador neutro', () => {
    const result = calculateWeaknesses(['normal'], TYPE_RELATIONS);

    expect(result).toEqual([
      { type: 'fighting', multiplier: 2 },
      { type: 'ghost', multiplier: 0 },
    ]);
  });
});
