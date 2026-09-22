/**
 * Funções puras DTO (PokéAPI) → contrato (`@pokedex/contracts`). Nenhuma regra de negócio aqui:
 * fraquezas, evolução, texto e unidades vêm de `@pokedex/domain` (ADR-005). Este é o único lugar
 * que conhece os dois formatos ao mesmo tempo.
 */
import {
  GENERATION_OPTIONS,
  POKEDEX_FIRST_ID,
  POKEDEX_LAST_ID,
  STAT_NAMES,
  TYPE_DISPLAY_NAMES,
  TYPE_NAMES,
  typeNameSchema,
  type AbilityView,
  type EvolutionStage,
  type GenerationOption,
  type PokemonDetail,
  type PokemonSummary,
  type StatValue,
  type TypeName,
  type TypeOption,
} from '@pokedex/contracts';
import {
  calculateWeaknesses,
  decimetersToMeters,
  flattenEvolutionChain,
  hectogramsToKilograms,
  sanitizeFlavorText,
  selectLocalizedText,
  toDisplayName,
  type DamageRelations,
  type DamageRelationsByType,
  type EvolutionChainNode,
  type LocalizedText,
} from '@pokedex/domain';
import type {
  AbilityDto,
  ChainLinkDto,
  EvolutionChainDto,
  NamedResourceDto,
  PokemonDto,
  SpeciesDto,
  TypeDto,
} from './schemas.js';

const SPRITE_FALLBACK_BASE =
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';

const NO_RELATIONS: DamageRelations = {
  doubleDamageFrom: [],
  halfDamageFrom: [],
  noDamageFrom: [],
};

/** Só os 18 canônicos; `stellar`, `unknown` e `shadow` são descartados (§2.3.3). */
export function toCanonicalTypeNames(resources: readonly NamedResourceDto[]): TypeName[] {
  return resources.flatMap((resource) => {
    const parsed = typeNameSchema.safeParse(resource.name);
    return parsed.success ? [parsed.data] : [];
  });
}

/** Ids da Pokédex nacional numa lista de recursos; formas alternativas (≥ 10001) ficam fora (§2.3.2). */
export function toPokedexIds(resources: readonly NamedResourceDto[]): Set<number> {
  return new Set(
    resources
      .map((resource) => resource.id)
      .filter((id) => id >= POKEDEX_FIRST_ID && id <= POKEDEX_LAST_ID),
  );
}

export function toPokemonSummary(dto: PokemonDto): PokemonSummary {
  const artworkUrl = dto.sprites.other?.['official-artwork']?.front_default ?? null;
  const typesBySlot = [...dto.types].sort((a, b) => a.slot - b.slot).map((entry) => entry.type);

  return {
    id: dto.id,
    name: dto.name,
    displayName: toDisplayName(dto.name),
    types: toCanonicalTypeNames(typesBySlot),
    // O contrato exige sprite; quando a API não tem front_default, a artwork ou a URL canônica do
    // repositório de sprites evitam derrubar a página por uma imagem.
    spriteUrl:
      dto.sprites.front_default ?? artworkUrl ?? `${SPRITE_FALLBACK_BASE}/${String(dto.id)}.png`,
    artworkUrl,
  };
}

export function toDamageRelations(dto: TypeDto): DamageRelations {
  return {
    doubleDamageFrom: toCanonicalTypeNames(dto.damage_relations.double_damage_from),
    halfDamageFrom: toCanonicalTypeNames(dto.damage_relations.half_damage_from),
    noDamageFrom: toCanonicalTypeNames(dto.damage_relations.no_damage_from),
  };
}

/** Monta o mapa dos 18 tipos sem cast: tipo ausente (impossível após buscar os 18) vira neutro. */
export function toRelationsByType(dtos: readonly TypeDto[]): DamageRelationsByType {
  const byName = new Map(dtos.map((dto) => [dto.name, toDamageRelations(dto)]));
  return recordByType((type) => byName.get(type) ?? NO_RELATIONS);
}

function recordByType<V>(valueOf: (type: TypeName) => V): Record<TypeName, V> {
  return {
    normal: valueOf('normal'),
    fighting: valueOf('fighting'),
    flying: valueOf('flying'),
    poison: valueOf('poison'),
    ground: valueOf('ground'),
    rock: valueOf('rock'),
    bug: valueOf('bug'),
    ghost: valueOf('ghost'),
    steel: valueOf('steel'),
    fire: valueOf('fire'),
    water: valueOf('water'),
    grass: valueOf('grass'),
    electric: valueOf('electric'),
    psychic: valueOf('psychic'),
    ice: valueOf('ice'),
    dragon: valueOf('dragon'),
    dark: valueOf('dark'),
    fairy: valueOf('fairy'),
  };
}

export function toEvolutionChainNode(link: ChainLinkDto): EvolutionChainNode {
  return {
    speciesName: link.species.name,
    speciesId: link.species.id,
    conditions: link.evolution_details.map((detail) => ({
      trigger: detail.trigger?.name ?? null,
      minLevel: detail.min_level,
      item: detail.item?.name ?? null,
      minHappiness: detail.min_happiness,
      timeOfDay: detail.time_of_day,
    })),
    evolvesTo: link.evolves_to.map(toEvolutionChainNode),
  };
}

export interface DetailSources {
  readonly pokemon: PokemonDto;
  readonly species: SpeciesDto;
  readonly chain: EvolutionChainDto;
  /** Indexadas pelo slug da habilidade. */
  readonly abilities: ReadonlyMap<string, AbilityDto>;
  readonly relationsByType: DamageRelationsByType;
  /** Já resolvidos pelo repositório (um `/pokemon/{id}` por espécie da cadeia). */
  readonly stages: readonly EvolutionStage[];
}

export function toPokemonDetail(sources: DetailSources): PokemonDetail {
  const { pokemon, species } = sources;
  const summary = toPokemonSummary(pokemon);
  const evolution = flattenEvolutionChain(toEvolutionChainNode(sources.chain.chain));

  return {
    ...summary,
    cryUrl: pokemon.cries?.latest ?? null,
    heightMeters: decimetersToMeters(pokemon.height),
    weightKilograms: hectogramsToKilograms(pokemon.weight),
    baseExperience: pokemon.base_experience,
    genus: selectLocalizedText(toLocalized(species.genera, (entry) => entry.genus)),
    flavorText: sanitizeFlavorText(
      selectLocalizedText(toLocalized(species.flavor_text_entries, (entry) => entry.flavor_text)),
    ),
    generation: species.generation.name,
    habitat: species.habitat?.name ?? null,
    isLegendary: species.is_legendary,
    isMythical: species.is_mythical,
    stats: toStats(pokemon.stats),
    abilities: toAbilities(pokemon.abilities, sources.abilities),
    evolution,
    evolutionStages: evolution.length === 0 ? [] : [...sources.stages],
    weaknesses: calculateWeaknesses(summary.types, sources.relationsByType),
  };
}

function toLocalized<T extends { language: NamedResourceDto }>(
  entries: readonly T[],
  textOf: (entry: T) => string,
): LocalizedText[] {
  return entries.map((entry) => ({ language: entry.language.name, text: textOf(entry) }));
}

/** Sempre os 6 stats na ordem de `STAT_NAMES`; stat ausente no upstream vira 0 em vez de quebrar o contrato. */
function toStats(dtoStats: PokemonDto['stats']): StatValue[] {
  const byName = new Map(dtoStats.map((stat) => [stat.stat.name, stat]));
  return STAT_NAMES.map((name) => {
    const stat = byName.get(name);
    return { name, base: stat?.base_stat ?? 0, effort: stat?.effort ?? 0 };
  });
}

function toAbilities(
  slots: PokemonDto['abilities'],
  abilities: ReadonlyMap<string, AbilityDto>,
): AbilityView[] {
  return [...slots]
    .sort((a, b) => a.slot - b.slot)
    .map((slot) => {
      const dto = abilities.get(slot.ability.name);
      return {
        name: slot.ability.name,
        displayName: toDisplayName(slot.ability.name),
        isHidden: slot.is_hidden,
        shortEffect:
          dto === undefined
            ? null
            : selectLocalizedText(toLocalized(dto.effect_entries, (entry) => entry.short_effect)),
      };
    });
}

/** `GET /type` → 21 nomes; ficam os 18 canônicos, na ordem canônica, com rótulo PT-BR. */
export function toTypeOptions(resources: readonly NamedResourceDto[]): TypeOption[] {
  const present = new Set(toCanonicalTypeNames(resources));
  return TYPE_NAMES.filter((name) => present.has(name)).map((name) => ({
    name,
    displayName: TYPE_DISPLAY_NAMES[name],
  }));
}

/** `GET /generation` → nomes; rótulo e região vêm do contrato. */
export function toGenerationOptions(resources: readonly NamedResourceDto[]): GenerationOption[] {
  const present = new Set(resources.map((resource) => resource.name));
  return GENERATION_OPTIONS.filter((option) => present.has(option.name));
}
