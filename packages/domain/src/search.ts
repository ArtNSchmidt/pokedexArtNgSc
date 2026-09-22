import { normalizeForSearch } from './text.js';

export interface Searchable {
  readonly normalizedName: string;
}

/**
 * Busca por substring sobre nomes já normalizados (ADR-003). Os que **começam** com o termo vêm
 * antes dos que apenas o **contêm** — é o que faz a busca parecer certa (Anexo B). A ordem relativa
 * dentro de cada grupo é preservada (estável). Termo vazio devolve tudo.
 */
export function searchByName<T extends Searchable>(items: readonly T[], term: string): T[] {
  const needle = normalizeForSearch(term);
  if (needle.length === 0) return [...items];

  const startsWith: T[] = [];
  const contains: T[] = [];
  for (const item of items) {
    if (item.normalizedName.startsWith(needle)) {
      startsWith.push(item);
    } else if (item.normalizedName.includes(needle)) {
      contains.push(item);
    }
  }
  return [...startsWith, ...contains];
}
