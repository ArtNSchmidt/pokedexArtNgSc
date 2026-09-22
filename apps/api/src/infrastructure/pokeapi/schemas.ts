/**
 * Formato do **terceiro** (PokéAPI v2), só nos campos que usamos (Anexo D). `z.looseObject`
 * preserva campos desconhecidos para não quebrar quando a API adicionar chaves. Nada daqui
 * vaza para fora de `infrastructure/`: o mapper traduz para `@pokedex/contracts`.
 */
import { generationNameSchema } from '@pokedex/contracts';
import { z } from 'zod';

const RESOURCE_ID_IN_URL = /\/(\d+)\/?$/;

/** `https://pokeapi.co/api/v2/pokemon/25/` → `25`; `null` quando a URL não termina em id. */
export function idFromResourceUrl(url: string): number | null {
  const match = RESOURCE_ID_IN_URL.exec(url);
  const digits = match?.[1];
  return digits === undefined ? null : Number(digits);
}

/**
 * `{ name, url }` é o par onipresente da PokéAPI. O `id` é derivado da URL na validação, então o
 * resto do adapter nunca faz parsing de string: uma URL sem id é resposta inválida, não `NaN`.
 */
const namedResourceSchema = z
  .object({ name: z.string(), url: z.string() })
  .transform((resource) => ({ ...resource, id: idFromResourceUrl(resource.url) }))
  .pipe(z.object({ name: z.string(), url: z.string(), id: z.number().int().nonnegative() }));

export type NamedResourceDto = z.infer<typeof namedResourceSchema>;

const localizedSchema = z.looseObject({ language: namedResourceSchema });

export const pokemonDtoSchema = z.looseObject({
  id: z.number().int(),
  name: z.string(),
  height: z.number(),
  weight: z.number(),
  base_experience: z.number().nullable(),
  types: z.array(z.looseObject({ slot: z.number(), type: namedResourceSchema })),
  stats: z.array(
    z.looseObject({ base_stat: z.number(), effort: z.number(), stat: namedResourceSchema }),
  ),
  abilities: z.array(
    z.looseObject({ is_hidden: z.boolean(), slot: z.number(), ability: namedResourceSchema }),
  ),
  sprites: z.looseObject({
    front_default: z.string().nullable(),
    other: z
      .looseObject({
        'official-artwork': z.looseObject({ front_default: z.string().nullable() }).optional(),
      })
      .optional(),
  }),
  cries: z.looseObject({ latest: z.string().nullable() }).optional(),
  species: namedResourceSchema,
});
export type PokemonDto = z.infer<typeof pokemonDtoSchema>;

export const speciesDtoSchema = z.looseObject({
  id: z.number().int(),
  name: z.string(),
  flavor_text_entries: z.array(localizedSchema.extend({ flavor_text: z.string() })),
  genera: z.array(localizedSchema.extend({ genus: z.string() })),
  generation: z.looseObject({ name: generationNameSchema }),
  habitat: namedResourceSchema.nullable(),
  is_legendary: z.boolean(),
  is_mythical: z.boolean(),
  evolution_chain: z
    .object({ url: z.string() })
    .transform((chain) => ({ ...chain, id: idFromResourceUrl(chain.url) }))
    .pipe(z.object({ url: z.string(), id: z.number().int().nonnegative() })),
});
export type SpeciesDto = z.infer<typeof speciesDtoSchema>;

const evolutionDetailSchema = z.looseObject({
  trigger: namedResourceSchema.nullable(),
  min_level: z.number().nullable(),
  item: namedResourceSchema.nullable(),
  min_happiness: z.number().nullable(),
  time_of_day: z.string(),
});

/** `chain` é recursivo; o getter é a forma do Zod 4 de declarar recursão com tipo inferido. */
export const chainLinkDtoSchema = z.looseObject({
  species: namedResourceSchema,
  evolution_details: z.array(evolutionDetailSchema),
  get evolves_to() {
    return z.array(chainLinkDtoSchema);
  },
});
export type ChainLinkDto = z.infer<typeof chainLinkDtoSchema>;

export const evolutionChainDtoSchema = z.looseObject({
  id: z.number().int(),
  chain: chainLinkDtoSchema,
});
export type EvolutionChainDto = z.infer<typeof evolutionChainDtoSchema>;

const typeListSchema = z.array(namedResourceSchema);

export const typeDtoSchema = z.looseObject({
  name: z.string(),
  damage_relations: z.looseObject({
    double_damage_from: typeListSchema,
    half_damage_from: typeListSchema,
    no_damage_from: typeListSchema,
  }),
  pokemon: z.array(z.looseObject({ slot: z.number(), pokemon: namedResourceSchema })),
});
export type TypeDto = z.infer<typeof typeDtoSchema>;

export const abilityDtoSchema = z.looseObject({
  name: z.string(),
  effect_entries: z.array(localizedSchema.extend({ short_effect: z.string() })),
});
export type AbilityDto = z.infer<typeof abilityDtoSchema>;

export const generationDtoSchema = z.looseObject({
  name: z.string(),
  main_region: namedResourceSchema,
  pokemon_species: z.array(namedResourceSchema),
});
export type GenerationDto = z.infer<typeof generationDtoSchema>;

/** `GET /pokemon?limit=…`, `GET /type`, `GET /generation`: listas paginadas de `{ name, url }`. */
export const resourceListDtoSchema = z.looseObject({
  count: z.number().int(),
  results: z.array(namedResourceSchema),
});
export type ResourceListDto = z.infer<typeof resourceListDtoSchema>;
