import type { EvolutionChainNode } from '../evolution.js';

/** GET /evolution-chain/1 (2026-09-22), no formato do domínio. */
export const bulbasaurChain: EvolutionChainNode = {
  speciesName: 'bulbasaur',
  speciesId: 1,
  conditions: [],
  evolvesTo: [
    {
      speciesName: 'ivysaur',
      speciesId: 2,
      conditions: [
        { trigger: 'level-up', minLevel: 16, item: null, minHappiness: null, timeOfDay: '' },
      ],
      evolvesTo: [
        {
          speciesName: 'venusaur',
          speciesId: 3,
          conditions: [
            { trigger: 'level-up', minLevel: 32, item: null, minHappiness: null, timeOfDay: '' },
          ],
          evolvesTo: [],
        },
      ],
    },
  ],
};

/** GET /evolution-chain/7 (2026-09-22), no formato do domínio. */
export const rattataChain: EvolutionChainNode = {
  speciesName: 'rattata',
  speciesId: 19,
  conditions: [],
  evolvesTo: [
    {
      speciesName: 'raticate',
      speciesId: 20,
      conditions: [
        { trigger: 'level-up', minLevel: 20, item: null, minHappiness: null, timeOfDay: '' },
        { trigger: 'level-up', minLevel: 20, item: null, minHappiness: null, timeOfDay: 'night' },
      ],
      evolvesTo: [],
    },
  ],
};

/** GET /evolution-chain/67 (2026-09-22), no formato do domínio. */
export const eeveeChain: EvolutionChainNode = {
  speciesName: 'eevee',
  speciesId: 133,
  conditions: [],
  evolvesTo: [
    {
      speciesName: 'vaporeon',
      speciesId: 134,
      conditions: [
        {
          trigger: 'use-item',
          minLevel: null,
          item: 'water-stone',
          minHappiness: null,
          timeOfDay: '',
        },
      ],
      evolvesTo: [],
    },
    {
      speciesName: 'jolteon',
      speciesId: 135,
      conditions: [
        {
          trigger: 'use-item',
          minLevel: null,
          item: 'thunder-stone',
          minHappiness: null,
          timeOfDay: '',
        },
      ],
      evolvesTo: [],
    },
    {
      speciesName: 'flareon',
      speciesId: 136,
      conditions: [
        {
          trigger: 'use-item',
          minLevel: null,
          item: 'fire-stone',
          minHappiness: null,
          timeOfDay: '',
        },
      ],
      evolvesTo: [],
    },
    {
      speciesName: 'espeon',
      speciesId: 196,
      conditions: [
        { trigger: 'level-up', minLevel: null, item: null, minHappiness: 160, timeOfDay: 'day' },
      ],
      evolvesTo: [],
    },
    {
      speciesName: 'umbreon',
      speciesId: 197,
      conditions: [
        { trigger: 'level-up', minLevel: null, item: null, minHappiness: 160, timeOfDay: 'night' },
      ],
      evolvesTo: [],
    },
    {
      speciesName: 'leafeon',
      speciesId: 470,
      conditions: [
        { trigger: 'level-up', minLevel: null, item: null, minHappiness: null, timeOfDay: '' },
        { trigger: 'level-up', minLevel: null, item: null, minHappiness: null, timeOfDay: '' },
        { trigger: 'level-up', minLevel: null, item: null, minHappiness: null, timeOfDay: '' },
        {
          trigger: 'use-item',
          minLevel: null,
          item: 'leaf-stone',
          minHappiness: null,
          timeOfDay: '',
        },
        { trigger: 'level-up', minLevel: null, item: null, minHappiness: null, timeOfDay: '' },
        { trigger: 'level-up', minLevel: null, item: null, minHappiness: null, timeOfDay: '' },
      ],
      evolvesTo: [],
    },
    {
      speciesName: 'glaceon',
      speciesId: 471,
      conditions: [
        { trigger: 'level-up', minLevel: null, item: null, minHappiness: null, timeOfDay: '' },
        { trigger: 'level-up', minLevel: null, item: null, minHappiness: null, timeOfDay: '' },
        { trigger: 'level-up', minLevel: null, item: null, minHappiness: null, timeOfDay: '' },
        {
          trigger: 'use-item',
          minLevel: null,
          item: 'ice-stone',
          minHappiness: null,
          timeOfDay: '',
        },
        { trigger: 'level-up', minLevel: null, item: null, minHappiness: null, timeOfDay: '' },
        { trigger: 'level-up', minLevel: null, item: null, minHappiness: null, timeOfDay: '' },
      ],
      evolvesTo: [],
    },
    {
      speciesName: 'sylveon',
      speciesId: 700,
      conditions: [
        { trigger: 'level-up', minLevel: null, item: null, minHappiness: null, timeOfDay: '' },
        { trigger: 'level-up', minLevel: null, item: null, minHappiness: 160, timeOfDay: '' },
      ],
      evolvesTo: [],
    },
  ],
};

/** Espécie sem evolução: nó raiz sem filhos. */
export const noEvolutionChain: EvolutionChainNode = {
  speciesName: 'ditto',
  speciesId: 132,
  conditions: [],
  evolvesTo: [],
};
