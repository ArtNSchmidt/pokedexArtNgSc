/**
 * Fixtures no formato do contrato, com valores conferidos contra a PokéAPI em 2026-09-22.
 * Permitem que domínio, API e UI trabalhem antes de existir rede. Cada uma é validada pelo próprio
 * schema em `fixtures.test.ts`: fixture que não passa no schema é mentira documentada.
 */
import {
  STAT_NAMES,
  type AbilityView,
  type EvolutionStage,
  type EvolutionStep,
  type PokemonDetail,
  type PokemonListPage,
  type PokemonSummary,
  type StatName,
  type StatValue,
} from './pokemon.js';
import type { DamageMultiplier, TypeName, Weakness } from './type.js';

const SPRITES_BASE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';
const CRIES_BASE = 'https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest';

const spriteUrl = (id: number): string => `${SPRITES_BASE}/${String(id)}.png`;
const artworkUrl = (id: number): string =>
  `${SPRITES_BASE}/other/official-artwork/${String(id)}.png`;
const cryUrl = (id: number): string => `${CRIES_BASE}/${String(id)}.ogg`;

type SummaryBase = Pick<PokemonSummary, 'id' | 'name' | 'displayName' | 'types'>;

const withSprites = (base: SummaryBase): PokemonSummary => ({
  ...base,
  spriteUrl: spriteUrl(base.id),
  artworkUrl: artworkUrl(base.id),
});

const stage = (pokemon: PokemonSummary): EvolutionStage => ({
  species: pokemon.name,
  pokemon,
});

const stats = (
  base: Readonly<Record<StatName, number>>,
  effort: Readonly<Partial<Record<StatName, number>>> = {},
): StatValue[] => STAT_NAMES.map((name) => ({ name, base: base[name], effort: effort[name] ?? 0 }));

type AbilityBase = Pick<AbilityView, 'name' | 'displayName' | 'shortEffect'>;
const ability = (base: AbilityBase): AbilityView => ({ ...base, isHidden: false });
const hiddenAbility = (base: AbilityBase): AbilityView => ({ ...base, isHidden: true });

const weakness = (type: TypeName, multiplier: DamageMultiplier): Weakness => ({ type, multiplier });

type StepOverrides = Pick<EvolutionStep, 'from' | 'to'> & Partial<EvolutionStep>;
const step = (overrides: StepOverrides): EvolutionStep => ({
  trigger: null,
  minLevel: null,
  item: null,
  minHappiness: null,
  timeOfDay: null,
  ...overrides,
});

const levelUp = (from: string, to: string, minLevel: number): EvolutionStep =>
  step({ from, to, trigger: 'level-up', minLevel });
const useItem = (from: string, to: string, item: string): EvolutionStep =>
  step({ from, to, trigger: 'use-item', item });

const overgrow = ability({
  name: 'overgrow',
  displayName: 'Overgrow',
  shortEffect: 'Strengthens Grass moves to inflict 1.5× damage at 1/3 max HP or less.',
});

// ---------------------------------------------------------------------------------------------
// Bulbasaur (#001) — grass/poison, linear em dois passos
// ---------------------------------------------------------------------------------------------

const bulbasaur = withSprites({
  id: 1,
  name: 'bulbasaur',
  displayName: 'Bulbasaur',
  types: ['grass', 'poison'],
});
const ivysaur = withSprites({
  id: 2,
  name: 'ivysaur',
  displayName: 'Ivysaur',
  types: ['grass', 'poison'],
});
const venusaur = withSprites({
  id: 3,
  name: 'venusaur',
  displayName: 'Venusaur',
  types: ['grass', 'poison'],
});

export const bulbasaurDetail: PokemonDetail = {
  ...bulbasaur,
  cryUrl: cryUrl(1),
  heightMeters: 0.7,
  weightKilograms: 6.9,
  baseExperience: 64,
  genus: 'Seed Pokémon',
  flavorText:
    'While it is young, it uses the nutrients that are stored in the seed on its back in order to grow.',
  generation: 'generation-i',
  habitat: 'grassland',
  isLegendary: false,
  isMythical: false,
  stats: stats(
    { hp: 45, attack: 49, defense: 49, 'special-attack': 65, 'special-defense': 65, speed: 45 },
    { 'special-attack': 1 },
  ),
  abilities: [
    overgrow,
    hiddenAbility({
      name: 'chlorophyll',
      displayName: 'Chlorophyll',
      shortEffect: 'Doubles Speed during strong sunlight.',
    }),
  ],
  evolution: [levelUp('bulbasaur', 'ivysaur', 16), levelUp('ivysaur', 'venusaur', 32)],
  evolutionStages: [stage(bulbasaur), stage(ivysaur), stage(venusaur)],
  weaknesses: [
    weakness('fire', 2),
    weakness('flying', 2),
    weakness('ice', 2),
    weakness('psychic', 2),
    weakness('electric', 0.5),
    weakness('fairy', 0.5),
    weakness('fighting', 0.5),
    weakness('water', 0.5),
    weakness('grass', 0.25),
  ],
};

// ---------------------------------------------------------------------------------------------
// Charizard (#006) — fire/flying, as 10 fraquezas de §6.4 (inclui ×4 e imunidade)
// ---------------------------------------------------------------------------------------------

const charmander = withSprites({
  id: 4,
  name: 'charmander',
  displayName: 'Charmander',
  types: ['fire'],
});
const charmeleon = withSprites({
  id: 5,
  name: 'charmeleon',
  displayName: 'Charmeleon',
  types: ['fire'],
});
const charizard = withSprites({
  id: 6,
  name: 'charizard',
  displayName: 'Charizard',
  types: ['fire', 'flying'],
});

export const charizardDetail: PokemonDetail = {
  ...charizard,
  cryUrl: cryUrl(6),
  heightMeters: 1.7,
  weightKilograms: 90.5,
  baseExperience: 240,
  genus: 'Flame Pokémon',
  flavorText:
    'Its wings can carry this Pokémon close to an altitude of 4,600 feet. It blows out fire at very high temperatures.',
  generation: 'generation-i',
  habitat: 'mountain',
  isLegendary: false,
  isMythical: false,
  stats: stats(
    { hp: 78, attack: 84, defense: 78, 'special-attack': 109, 'special-defense': 85, speed: 100 },
    { 'special-attack': 3 },
  ),
  abilities: [
    ability({
      name: 'blaze',
      displayName: 'Blaze',
      shortEffect: 'Strengthens Fire moves to inflict 1.5× damage at 1/3 max HP or less.',
    }),
    hiddenAbility({
      name: 'solar-power',
      displayName: 'Solar Power',
      shortEffect:
        'Increases Special Attack to 1.5× but costs 1/8 max HP after each turn during strong sunlight.',
    }),
  ],
  evolution: [levelUp('charmander', 'charmeleon', 16), levelUp('charmeleon', 'charizard', 36)],
  evolutionStages: [stage(charmander), stage(charmeleon), stage(charizard)],
  weaknesses: [
    weakness('rock', 4),
    weakness('electric', 2),
    weakness('water', 2),
    weakness('fairy', 0.5),
    weakness('fighting', 0.5),
    weakness('fire', 0.5),
    weakness('steel', 0.5),
    weakness('bug', 0.25),
    weakness('grass', 0.25),
    weakness('ground', 0),
  ],
};

// ---------------------------------------------------------------------------------------------
// Eevee (#133) — normal, 8 ramos a partir do mesmo `from` (ramificação larga, Anexo B)
// ---------------------------------------------------------------------------------------------

const eevee = withSprites({ id: 133, name: 'eevee', displayName: 'Eevee', types: ['normal'] });
const eeveelutions: readonly PokemonSummary[] = [
  withSprites({ id: 134, name: 'vaporeon', displayName: 'Vaporeon', types: ['water'] }),
  withSprites({ id: 135, name: 'jolteon', displayName: 'Jolteon', types: ['electric'] }),
  withSprites({ id: 136, name: 'flareon', displayName: 'Flareon', types: ['fire'] }),
  withSprites({ id: 196, name: 'espeon', displayName: 'Espeon', types: ['psychic'] }),
  withSprites({ id: 197, name: 'umbreon', displayName: 'Umbreon', types: ['dark'] }),
  withSprites({ id: 470, name: 'leafeon', displayName: 'Leafeon', types: ['grass'] }),
  withSprites({ id: 471, name: 'glaceon', displayName: 'Glaceon', types: ['ice'] }),
  withSprites({ id: 700, name: 'sylveon', displayName: 'Sylveon', types: ['fairy'] }),
];

/**
 * A API traz 6 entradas de `evolution_details` para Leafeon e Glaceon (uma por local) e 2 para
 * Sylveon. O domínio deduplica pela condição projetada no contrato (Anexo B), o que resulta em
 * 11 passos e 8 destinos distintos.
 */
export const eeveeDetail: PokemonDetail = {
  ...eevee,
  cryUrl: cryUrl(133),
  heightMeters: 0.3,
  weightKilograms: 6.5,
  baseExperience: 65,
  genus: 'Evolution Pokémon',
  flavorText:
    'Harbors the potential to evolve into manifold forms. Within Eevee lies the key to the mysteries of Pokémon evolution—I’m certain of it.',
  generation: 'generation-i',
  habitat: 'urban',
  isLegendary: false,
  isMythical: false,
  stats: stats(
    { hp: 55, attack: 55, defense: 50, 'special-attack': 45, 'special-defense': 65, speed: 55 },
    { 'special-defense': 1 },
  ),
  abilities: [
    ability({
      name: 'run-away',
      displayName: 'Run Away',
      shortEffect: 'Ensures success fleeing from wild battles.',
    }),
    ability({
      name: 'adaptability',
      displayName: 'Adaptability',
      shortEffect: 'Increases the same-type attack bonus from 1.5× to 2×.',
    }),
    hiddenAbility({
      name: 'anticipation',
      displayName: 'Anticipation',
      shortEffect:
        'Notifies all trainers upon entering battle if an opponent has a super-effective move, Self-Destruct, Explosion, or a one-hit KO move.',
    }),
  ],
  evolution: [
    useItem('eevee', 'vaporeon', 'water-stone'),
    useItem('eevee', 'jolteon', 'thunder-stone'),
    useItem('eevee', 'flareon', 'fire-stone'),
    step({ from: 'eevee', to: 'espeon', trigger: 'level-up', minHappiness: 160, timeOfDay: 'day' }),
    step({
      from: 'eevee',
      to: 'umbreon',
      trigger: 'level-up',
      minHappiness: 160,
      timeOfDay: 'night',
    }),
    step({ from: 'eevee', to: 'leafeon', trigger: 'level-up' }),
    useItem('eevee', 'leafeon', 'leaf-stone'),
    step({ from: 'eevee', to: 'glaceon', trigger: 'level-up' }),
    useItem('eevee', 'glaceon', 'ice-stone'),
    step({ from: 'eevee', to: 'sylveon', trigger: 'level-up' }),
    step({ from: 'eevee', to: 'sylveon', trigger: 'level-up', minHappiness: 160 }),
  ],
  evolutionStages: [stage(eevee), ...eeveelutions.map(stage)],
  weaknesses: [weakness('fighting', 2), weakness('ghost', 0)],
};

// ---------------------------------------------------------------------------------------------
// Sprigatito (#906) — grass, geração IX, `habitat: null`
// ---------------------------------------------------------------------------------------------

const sprigatito = withSprites({
  id: 906,
  name: 'sprigatito',
  displayName: 'Sprigatito',
  types: ['grass'],
});
const floragato = withSprites({
  id: 907,
  name: 'floragato',
  displayName: 'Floragato',
  types: ['grass'],
});
const meowscarada = withSprites({
  id: 908,
  name: 'meowscarada',
  displayName: 'Meowscarada',
  types: ['grass', 'dark'],
});

export const sprigatitoDetail: PokemonDetail = {
  ...sprigatito,
  cryUrl: cryUrl(906),
  heightMeters: 0.4,
  weightKilograms: 4.1,
  baseExperience: 62,
  genus: 'Grass Cat Pokémon',
  flavorText:
    'The sweet scent its body gives off mesmerizes those around it. The scent grows stronger when this Pokémon is in the sun.',
  generation: 'generation-ix',
  habitat: null,
  isLegendary: false,
  isMythical: false,
  stats: stats(
    { hp: 40, attack: 61, defense: 54, 'special-attack': 45, 'special-defense': 45, speed: 65 },
    { speed: 1 },
  ),
  abilities: [
    overgrow,
    hiddenAbility({
      name: 'protean',
      displayName: 'Protean',
      shortEffect: "Changes the bearer's type to match each move it uses.",
    }),
  ],
  evolution: [levelUp('sprigatito', 'floragato', 16), levelUp('floragato', 'meowscarada', 36)],
  evolutionStages: [stage(sprigatito), stage(floragato), stage(meowscarada)],
  weaknesses: [
    weakness('bug', 2),
    weakness('fire', 2),
    weakness('flying', 2),
    weakness('ice', 2),
    weakness('poison', 2),
    weakness('electric', 0.5),
    weakness('grass', 0.5),
    weakness('ground', 0.5),
    weakness('water', 0.5),
  ],
};

// ---------------------------------------------------------------------------------------------
// Lista — primeira página da Pokédex nacional sem filtros (24 itens de 1.025)
// ---------------------------------------------------------------------------------------------

const firstPageEntries: readonly SummaryBase[] = [
  bulbasaur,
  ivysaur,
  venusaur,
  charmander,
  charmeleon,
  charizard,
  { id: 7, name: 'squirtle', displayName: 'Squirtle', types: ['water'] },
  { id: 8, name: 'wartortle', displayName: 'Wartortle', types: ['water'] },
  { id: 9, name: 'blastoise', displayName: 'Blastoise', types: ['water'] },
  { id: 10, name: 'caterpie', displayName: 'Caterpie', types: ['bug'] },
  { id: 11, name: 'metapod', displayName: 'Metapod', types: ['bug'] },
  { id: 12, name: 'butterfree', displayName: 'Butterfree', types: ['bug', 'flying'] },
  { id: 13, name: 'weedle', displayName: 'Weedle', types: ['bug', 'poison'] },
  { id: 14, name: 'kakuna', displayName: 'Kakuna', types: ['bug', 'poison'] },
  { id: 15, name: 'beedrill', displayName: 'Beedrill', types: ['bug', 'poison'] },
  { id: 16, name: 'pidgey', displayName: 'Pidgey', types: ['normal', 'flying'] },
  { id: 17, name: 'pidgeotto', displayName: 'Pidgeotto', types: ['normal', 'flying'] },
  { id: 18, name: 'pidgeot', displayName: 'Pidgeot', types: ['normal', 'flying'] },
  { id: 19, name: 'rattata', displayName: 'Rattata', types: ['normal'] },
  { id: 20, name: 'raticate', displayName: 'Raticate', types: ['normal'] },
  { id: 21, name: 'spearow', displayName: 'Spearow', types: ['normal', 'flying'] },
  { id: 22, name: 'fearow', displayName: 'Fearow', types: ['normal', 'flying'] },
  { id: 23, name: 'ekans', displayName: 'Ekans', types: ['poison'] },
  { id: 24, name: 'arbok', displayName: 'Arbok', types: ['poison'] },
];

const POKEDEX_SIZE = 1025;
const PAGE_SIZE = 24;

export const listPageFixture: PokemonListPage = {
  items: firstPageEntries.map(withSprites),
  page: 1,
  pageSize: PAGE_SIZE,
  total: POKEDEX_SIZE,
  totalPages: Math.ceil(POKEDEX_SIZE / PAGE_SIZE),
};

/** Resultado de um filtro que não casa com nada: a UI mostra "Nenhum Pokémon encontrado". */
export const emptyListPageFixture: PokemonListPage = {
  items: [],
  page: 1,
  pageSize: PAGE_SIZE,
  total: 0,
  totalPages: 0,
};
