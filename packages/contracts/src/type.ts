import { z } from 'zod';

/**
 * Os 18 tipos canônicos da tabela de efetividade. A PokéAPI devolve 21 (`stellar`, `unknown` e
 * `shadow` a mais); eles não pertencem ao contrato e são filtrados na borda (§2.3.3).
 */
export const TYPE_NAMES = [
  'normal',
  'fighting',
  'flying',
  'poison',
  'ground',
  'rock',
  'bug',
  'ghost',
  'steel',
  'fire',
  'water',
  'grass',
  'electric',
  'psychic',
  'ice',
  'dragon',
  'dark',
  'fairy',
] as const;

export const typeNameSchema = z.enum(TYPE_NAMES);
export type TypeName = z.infer<typeof typeNameSchema>;

/** Rótulo em PT-BR de cada tipo. É dado de contrato: API e UI exibem o mesmo nome. */
export const TYPE_DISPLAY_NAMES: Readonly<Record<TypeName, string>> = {
  normal: 'Normal',
  fighting: 'Lutador',
  flying: 'Voador',
  poison: 'Venenoso',
  ground: 'Terrestre',
  rock: 'Pedra',
  bug: 'Inseto',
  ghost: 'Fantasma',
  steel: 'Aço',
  fire: 'Fogo',
  water: 'Água',
  grass: 'Planta',
  electric: 'Elétrico',
  psychic: 'Psíquico',
  ice: 'Gelo',
  dragon: 'Dragão',
  dark: 'Sombrio',
  fairy: 'Fada',
};

export const typeOptionSchema = z.object({
  name: typeNameSchema,
  displayName: z.string().min(1),
});
export type TypeOption = z.infer<typeof typeOptionSchema>;

/** Os 18 tipos na ordem canônica, prontos para o filtro da lista (`GET /types`). */
export const TYPE_OPTIONS: readonly TypeOption[] = TYPE_NAMES.map((name) => ({
  name,
  displayName: TYPE_DISPLAY_NAMES[name],
}));

/**
 * Multiplicadores possíveis de dano recebido para 1 ou 2 tipos defensores.
 * `1` é omitido da lista de fraquezas: a UI só mostra desvio da neutralidade.
 */
export const damageMultiplierSchema = z.literal([0, 0.25, 0.5, 2, 4]);
export type DamageMultiplier = z.infer<typeof damageMultiplierSchema>;

export const weaknessSchema = z.object({
  type: typeNameSchema,
  multiplier: damageMultiplierSchema,
});
export type Weakness = z.infer<typeof weaknessSchema>;
