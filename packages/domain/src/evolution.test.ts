import { describe, expect, it } from 'vitest';
import {
  bulbasaurChain,
  eeveeChain,
  noEvolutionChain,
  rattataChain,
} from './__fixtures__/evolutionChains.js';
import { flattenEvolutionChain, listEvolutionSpecies } from './evolution.js';

describe('flattenEvolutionChain (Anexo B)', () => {
  it('cadeia 1 (Bulbasaur): exatamente 2 passos, níveis 16 e 32', () => {
    expect(flattenEvolutionChain(bulbasaurChain)).toEqual([
      {
        from: 'bulbasaur',
        to: 'ivysaur',
        trigger: 'level-up',
        minLevel: 16,
        item: null,
        minHappiness: null,
        timeOfDay: null,
      },
      {
        from: 'ivysaur',
        to: 'venusaur',
        trigger: 'level-up',
        minLevel: 32,
        item: null,
        minHappiness: null,
        timeOfDay: null,
      },
    ]);
  });

  it('cadeia 67 (Eevee): 8 destinos distintos, todos a partir de eevee', () => {
    const steps = flattenEvolutionChain(eeveeChain);

    expect(steps.every((step) => step.from === 'eevee')).toBe(true);
    expect(new Set(steps.map((step) => step.to)).size).toBe(8);
  });

  it('cadeia 67 (Eevee): deduplica condições que só diferem em campos fora do contrato', () => {
    const steps = flattenEvolutionChain(eeveeChain);
    const leafeon = steps.filter((step) => step.to === 'leafeon');

    // A API traz 6 entradas para Leafeon (5 locais + leaf-stone); projetadas, sobram 2.
    expect(leafeon).toEqual([
      expect.objectContaining({ trigger: 'level-up', item: null }),
      expect.objectContaining({ trigger: 'use-item', item: 'leaf-stone' }),
    ]);
    expect(steps).toHaveLength(11);
  });

  it('cadeia 7 (Rattata): 2 passos, nível 20 a qualquer hora e nível 20 à noite', () => {
    expect(flattenEvolutionChain(rattataChain)).toEqual([
      expect.objectContaining({ from: 'rattata', to: 'raticate', minLevel: 20, timeOfDay: null }),
      expect.objectContaining({
        from: 'rattata',
        to: 'raticate',
        minLevel: 20,
        timeOfDay: 'night',
      }),
    ]);
  });

  it('espécie sem evolução devolve lista vazia', () => {
    expect(flattenEvolutionChain(noEvolutionChain)).toEqual([]);
  });

  it('filho sem evolution_details vira um passo com tudo null', () => {
    const chain = {
      speciesName: 'a',
      speciesId: 1,
      conditions: [],
      evolvesTo: [{ speciesName: 'b', speciesId: 2, conditions: [], evolvesTo: [] }],
    };

    expect(flattenEvolutionChain(chain)).toEqual([
      {
        from: 'a',
        to: 'b',
        trigger: null,
        minLevel: null,
        item: null,
        minHappiness: null,
        timeOfDay: null,
      },
    ]);
  });
});

describe('listEvolutionSpecies', () => {
  it('devolve raiz primeiro e depois os descendentes em profundidade, com id', () => {
    expect(listEvolutionSpecies(bulbasaurChain)).toEqual([
      { name: 'bulbasaur', id: 1 },
      { name: 'ivysaur', id: 2 },
      { name: 'venusaur', id: 3 },
    ]);
    expect(listEvolutionSpecies(eeveeChain)).toHaveLength(9);
  });
});
