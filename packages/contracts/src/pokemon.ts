import { z } from 'zod';
import { generationNameSchema } from './generation.js';
import { typeNameSchema, weaknessSchema } from './type.js';

/** Faixa da Pokédex nacional. Ids ≥ 10001 são formas alternativas e ficam fora do contrato (§2.3.2). */
export const POKEDEX_FIRST_ID = 1;
export const POKEDEX_LAST_ID = 1025;

export const pokemonIdSchema = z.number().int().min(POKEDEX_FIRST_ID).max(POKEDEX_LAST_ID);

export const STAT_NAMES = [
  'hp',
  'attack',
  'defense',
  'special-attack',
  'special-defense',
  'speed',
] as const;
export const statNameSchema = z.enum(STAT_NAMES);
export type StatName = z.infer<typeof statNameSchema>;

/** Máximo teórico de um stat base; referência da barra proporcional na UI (§7.8). */
export const MAX_BASE_STAT = 255;

export const pokemonSummarySchema = z.object({
  id: pokemonIdSchema,
  /** Slug da API, ex.: `mr-mime`, `deoxys-normal`. */
  name: z.string().min(1),
  /** Para exibir, ex.: `Mr Mime`. */
  displayName: z.string().min(1),
  /** Ordenado por slot; 1 ou 2 itens. */
  types: z.array(typeNameSchema).min(1).max(2),
  /** `sprites.front_default`. */
  spriteUrl: z.url(),
  /** `sprites.other['official-artwork'].front_default`; no resumo por decisão de UI (ADR-004). */
  artworkUrl: z.url().nullable(),
});
export type PokemonSummary = z.infer<typeof pokemonSummarySchema>;

export const pokemonListPageSchema = z.object({
  items: z.array(pokemonSummarySchema),
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1).max(60),
  /** Total APÓS filtros. */
  total: z.number().int().min(0),
  totalPages: z.number().int().min(0),
});
export type PokemonListPage = z.infer<typeof pokemonListPageSchema>;

export const statValueSchema = z.object({
  name: statNameSchema,
  base: z.number().int().min(0).max(MAX_BASE_STAT),
  effort: z.number().int().min(0).max(3),
});
export type StatValue = z.infer<typeof statValueSchema>;

export const abilityViewSchema = z.object({
  name: z.string().min(1),
  displayName: z.string().min(1),
  isHidden: z.boolean(),
  /** `effect_entries[language=en].short_effect`; `null` quando a API não tem texto em inglês. */
  shortEffect: z.string().nullable(),
});
export type AbilityView = z.infer<typeof abilityViewSchema>;

/** Uma transição da cadeia evolutiva (aresta), já achatada pelo domínio (Anexo B). */
export const evolutionStepSchema = z.object({
  /** Slug da espécie de origem. */
  from: z.string().min(1),
  /** Slug da espécie de destino. */
  to: z.string().min(1),
  /** `level-up`, `use-item`, `trade`…; `null` quando a API não informa. */
  trigger: z.string().nullable(),
  minLevel: z.number().int().nullable(),
  item: z.string().nullable(),
  minHappiness: z.number().int().nullable(),
  /** `""` da API vira `null`. */
  timeOfDay: z.string().nullable(),
});
export type EvolutionStep = z.infer<typeof evolutionStepSchema>;

/**
 * Um nó da cadeia evolutiva: a espécie e o Pokémon padrão dela, para a UI mostrar sprite e nome
 * sem chamar a API por estágio. Adição ao §6 registrada no ADR-004.
 */
export const evolutionStageSchema = z.object({
  species: z.string().min(1),
  pokemon: pokemonSummarySchema,
});
export type EvolutionStage = z.infer<typeof evolutionStageSchema>;

export const pokemonDetailSchema = pokemonSummarySchema.extend({
  /** `cries.latest`. */
  cryUrl: z.url().nullable(),
  /** `height / 10` (a API usa decímetros). */
  heightMeters: z.number().nonnegative(),
  /** `weight / 10` (a API usa hectogramas). */
  weightKilograms: z.number().nonnegative(),
  baseExperience: z.number().int().nullable(),
  /** `genera[language=en].genus`. */
  genus: z.string().nullable(),
  /** Sanitizado (Anexo C). */
  flavorText: z.string().nullable(),
  generation: generationNameSchema,
  /** `null` em gerações recentes. */
  habitat: z.string().nullable(),
  isLegendary: z.boolean(),
  isMythical: z.boolean(),
  /** 6 itens, na ordem de `STAT_NAMES`. */
  stats: z.array(statValueSchema).length(STAT_NAMES.length),
  abilities: z.array(abilityViewSchema),
  /** Cadeia achatada; `[]` se não evolui. */
  evolution: z.array(evolutionStepSchema),
  /** Nós da cadeia, em ordem de travessia; `[]` se não evolui. */
  evolutionStages: z.array(evolutionStageSchema),
  /** Só multiplicador ≠ 1, ordenado por multiplicador decrescente e, no empate, por nome. */
  weaknesses: z.array(weaknessSchema),
});
export type PokemonDetail = z.infer<typeof pokemonDetailSchema>;

/** Parâmetro de rota de `GET /pokemon/:idOrName`. */
export const pokemonIdentifierSchema = z.string().trim().min(1).max(60);

export const LIST_DEFAULT_PAGE = 1;
export const LIST_DEFAULT_PAGE_SIZE = 24;
export const LIST_MAX_PAGE_SIZE = 60;
export const SEARCH_MAX_LENGTH = 40;

/**
 * Parâmetro em branco conta como **não informado**: `?q=`, `?q=%20%20` e `?page=` valem o mesmo
 * que omitir. Sem isso, uma URL digitada à mão (ou uma busca só com espaços) viraria `400`.
 */
const blankAsUndefined = (value: unknown): unknown => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
};

/**
 * Query de `GET /pokemon` (§6.1). `coerce` porque query string é sempre texto; `page=abc` vira
 * `NaN` e falha no `int()`, então nunca chega ao caso de uso. `q`, `type` e `generation` são
 * combináveis e se aplicam como interseção.
 */
export const listQuerySchema = z.object({
  page: z.preprocess(blankAsUndefined, z.coerce.number().int().min(1).default(LIST_DEFAULT_PAGE)),
  pageSize: z.preprocess(
    blankAsUndefined,
    z.coerce.number().int().min(1).max(LIST_MAX_PAGE_SIZE).default(LIST_DEFAULT_PAGE_SIZE),
  ),
  q: z.preprocess(blankAsUndefined, z.string().min(1).max(SEARCH_MAX_LENGTH).optional()),
  type: z.preprocess(blankAsUndefined, typeNameSchema.optional()),
  generation: z.preprocess(blankAsUndefined, generationNameSchema.optional()),
});
export type ListQuery = z.infer<typeof listQuerySchema>;
