import {
  TYPE_NAMES,
  type DamageMultiplier,
  type TypeName,
  type Weakness,
} from '@pokedex/contracts';

/** Relações defensivas de um tipo, já traduzidas do formato do upstream pelo adapter (A3). */
export interface DamageRelations {
  readonly doubleDamageFrom: readonly TypeName[];
  readonly halfDamageFrom: readonly TypeName[];
  readonly noDamageFrom: readonly TypeName[];
}

export type DamageRelationsByType = Readonly<Record<TypeName, DamageRelations>>;

const NEUTRAL = 1;
const DOUBLE = 2;
const HALF = 0.5;
const NONE = 0;
const MAX_MULTIPLIER: DamageMultiplier = 4;
const MIN_NONZERO_MULTIPLIER: DamageMultiplier = 0.25;

/**
 * Anexo A. Parte de todos os 18 tipos atacantes em 1 e, para cada tipo do defensor, multiplica pelo
 * fator defensivo. Multiplicar (não somar) é o que produz ×4 em tipo duplo com fraqueza repetida e
 * o que preserva a imunidade: zero absorve qualquer fator posterior (Sableye: fighting ×0 mesmo
 * com ghost neutralizado). Entradas em 1 são descartadas; ordena por multiplicador decrescente e,
 * no empate, por nome.
 */
export function calculateWeaknesses(
  defenderTypes: readonly TypeName[],
  relationsByType: DamageRelationsByType,
): Weakness[] {
  const multipliers = new Map<TypeName, number>(TYPE_NAMES.map((type) => [type, NEUTRAL]));

  for (const defender of defenderTypes) {
    applyDefensiveRelations(multipliers, relationsByType[defender]);
  }

  return [...multipliers]
    .filter(([, multiplier]) => multiplier !== NEUTRAL)
    .map(([type, multiplier]) => ({ type, multiplier: toDamageMultiplier(multiplier) }))
    .sort(compareByMultiplierDescThenName);
}

function applyDefensiveRelations(
  multipliers: Map<TypeName, number>,
  relations: DamageRelations,
): void {
  multiplyEach(multipliers, relations.doubleDamageFrom, DOUBLE);
  multiplyEach(multipliers, relations.halfDamageFrom, HALF);
  multiplyEach(multipliers, relations.noDamageFrom, NONE);
}

function multiplyEach(
  multipliers: Map<TypeName, number>,
  attackers: readonly TypeName[],
  factor: number,
): void {
  for (const attacker of attackers) {
    multipliers.set(attacker, (multipliers.get(attacker) ?? NEUTRAL) * factor);
  }
}

/**
 * Com até dois tipos defensores o produto é sempre 0, ¼, ½, 2 ou 4. O clamp mantém a função total
 * caso um dia entrem três tipos; não é caminho que a Pokédex exercita.
 */
function toDamageMultiplier(value: number): DamageMultiplier {
  if (value === NONE) return 0;
  if (value >= MAX_MULTIPLIER) return MAX_MULTIPLIER;
  if (value >= DOUBLE) return 2;
  if (value <= MIN_NONZERO_MULTIPLIER) return MIN_NONZERO_MULTIPLIER;
  return 0.5;
}

function compareByMultiplierDescThenName(a: Weakness, b: Weakness): number {
  if (a.multiplier !== b.multiplier) return b.multiplier - a.multiplier;
  return a.type < b.type ? -1 : 1;
}
