import type { EvolutionStep } from '@pokedex/contracts';
import { describe, expect, it } from 'vitest';
import { describeEvolutionStep } from './describeEvolutionStep';

const step = (overrides: Partial<EvolutionStep>): EvolutionStep => ({
  from: 'a',
  to: 'b',
  trigger: null,
  minLevel: null,
  item: null,
  minHappiness: null,
  timeOfDay: null,
  ...overrides,
});

describe('describeEvolutionStep', () => {
  it.each([
    [step({ trigger: 'level-up', minLevel: 16 }), 'Nível 16'],
    [step({ trigger: 'level-up', minLevel: 20, timeOfDay: 'night' }), 'Nível 20 à noite'],
    [step({ trigger: 'level-up', minHappiness: 160, timeOfDay: 'day' }), 'Amizade alta de dia'],
    [step({ trigger: 'level-up' }), 'Sobe de nível'],
    [step({ trigger: 'use-item', item: 'water-stone' }), 'Usar Water Stone'],
    [step({ trigger: 'trade' }), 'Troca'],
    [step({ trigger: 'trade', item: 'metal-coat' }), 'Troca com Metal Coat'],
    [step({ trigger: 'other' }), 'Other'],
    [step({}), 'Condição especial'],
  ])('%o → %s', (input, expected) => {
    expect(describeEvolutionStep(input)).toBe(expected);
  });
});
