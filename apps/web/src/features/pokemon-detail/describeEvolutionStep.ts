import type { EvolutionStep } from '@pokedex/contracts';
import { humanizeSlug } from '../../shared/format';

const TIME_OF_DAY_LABELS: Readonly<Record<string, string>> = {
  day: 'de dia',
  night: 'à noite',
  dusk: 'ao entardecer',
};

const TRIGGER_LABELS: Readonly<Record<string, string>> = {
  'level-up': 'Sobe de nível',
  'use-item': 'Usar item',
  trade: 'Troca',
  shed: 'Ao evoluir com espaço na equipe',
};

const UNKNOWN_CONDITION = 'Condição especial';

/**
 * Apresentação em PT-BR de um passo já achatado pelo domínio. Não há regra aqui: só rótulos para
 * os campos do contrato (`trigger`, `minLevel`, `item`, `minHappiness`, `timeOfDay`).
 */
export function describeEvolutionStep(step: EvolutionStep): string {
  if (step.trigger === null) return UNKNOWN_CONDITION;
  if (step.trigger === 'use-item') {
    return step.item === null
      ? (TRIGGER_LABELS['use-item'] ?? UNKNOWN_CONDITION)
      : `Usar ${humanizeSlug(step.item)}`;
  }
  if (step.trigger === 'level-up') return describeLevelUp(step);

  const base = TRIGGER_LABELS[step.trigger] ?? humanizeSlug(step.trigger);
  return step.item === null ? base : `${base} com ${humanizeSlug(step.item)}`;
}

function describeLevelUp(step: EvolutionStep): string {
  const parts: string[] = [];
  if (step.minLevel !== null) parts.push(`Nível ${String(step.minLevel)}`);
  if (step.minHappiness !== null)
    parts.push(parts.length === 0 ? 'Amizade alta' : 'com amizade alta');
  if (step.item !== null) parts.push(`segurando ${humanizeSlug(step.item)}`);
  if (step.timeOfDay !== null) parts.push(TIME_OF_DAY_LABELS[step.timeOfDay] ?? step.timeOfDay);

  return parts.length === 0 ? (TRIGGER_LABELS['level-up'] ?? UNKNOWN_CONDITION) : parts.join(' ');
}
