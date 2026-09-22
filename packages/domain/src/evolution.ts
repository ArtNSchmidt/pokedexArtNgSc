import type { EvolutionStep } from '@pokedex/contracts';

/** Uma condição de evolução, já projetada nos campos do contrato (§6.2). */
export interface EvolutionCondition {
  readonly trigger: string | null;
  readonly minLevel: number | null;
  readonly item: string | null;
  readonly minHappiness: number | null;
  readonly timeOfDay: string | null;
}

/** Nó da árvore de evolução, no formato do domínio (o adapter traduz `chain` da PokéAPI para isto). */
export interface EvolutionChainNode {
  readonly speciesName: string;
  readonly speciesId: number;
  readonly conditions: readonly EvolutionCondition[];
  readonly evolvesTo: readonly EvolutionChainNode[];
}

export interface EvolutionSpecies {
  readonly name: string;
  readonly id: number;
}

const NO_CONDITION: EvolutionCondition = {
  trigger: null,
  minLevel: null,
  item: null,
  minHappiness: null,
  timeOfDay: null,
};

/**
 * Anexo B. Percorre em profundidade carregando o `from` (a espécie do nó pai). O nó raiz não gera
 * passo. Para cada filho emite um passo por condição **distinta após a projeção**: a PokéAPI traz,
 * por exemplo, seis entradas para Eevee → Leafeon que só diferem no `location`, campo que o contrato
 * não tem; repeti-las seria ruído. Lista vazia vira um único passo com tudo `null`.
 */
export function flattenEvolutionChain(root: EvolutionChainNode): EvolutionStep[] {
  const steps: EvolutionStep[] = [];
  collectSteps(root, steps);
  return steps;
}

function collectSteps(parent: EvolutionChainNode, steps: EvolutionStep[]): void {
  for (const child of parent.evolvesTo) {
    for (const condition of distinctConditions(child.conditions)) {
      steps.push({ from: parent.speciesName, to: child.speciesName, ...condition });
    }
    collectSteps(child, steps);
  }
}

function distinctConditions(conditions: readonly EvolutionCondition[]): EvolutionCondition[] {
  if (conditions.length === 0) return [NO_CONDITION];

  const seen = new Set<string>();
  const distinct: EvolutionCondition[] = [];
  for (const raw of conditions) {
    const condition = normalizeCondition(raw);
    const key = conditionKey(condition);
    if (seen.has(key)) continue;
    seen.add(key);
    distinct.push(condition);
  }
  return distinct;
}

/** `time_of_day: ""` da API significa "qualquer hora"; no contrato isso é `null` (§6.2). */
function normalizeCondition(condition: EvolutionCondition): EvolutionCondition {
  return {
    ...condition,
    trigger: emptyAsNull(condition.trigger),
    item: emptyAsNull(condition.item),
    timeOfDay: emptyAsNull(condition.timeOfDay),
  };
}

function emptyAsNull(value: string | null): string | null {
  return value === '' ? null : value;
}

function conditionKey(condition: EvolutionCondition): string {
  return [
    condition.trigger,
    condition.minLevel,
    condition.item,
    condition.minHappiness,
    condition.timeOfDay,
  ].join('|');
}

/** Espécies da cadeia em ordem de travessia (raiz primeiro), para o adapter montar os estágios. */
export function listEvolutionSpecies(root: EvolutionChainNode): EvolutionSpecies[] {
  const species: EvolutionSpecies[] = [];
  collectSpecies(root, species);
  return species;
}

function collectSpecies(node: EvolutionChainNode, species: EvolutionSpecies[]): void {
  species.push({ name: node.speciesName, id: node.speciesId });
  for (const child of node.evolvesTo) {
    collectSpecies(child, species);
  }
}
