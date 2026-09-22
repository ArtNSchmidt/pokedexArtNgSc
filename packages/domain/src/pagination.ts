export interface Page<T> {
  readonly items: T[];
  readonly page: number;
  readonly pageSize: number;
  readonly total: number;
  readonly totalPages: number;
}

/**
 * Paginação local sobre uma lista já filtrada (ADR-003). Página além do fim devolve `items` vazio
 * mantendo `page` e `total`, para a UI explicar "página 7 de 2" em vez de quebrar. Valores abaixo
 * de 1, fracionários ou não numéricos são saturados em 1: a função é total (§5.3).
 */
export function paginate<T>(items: readonly T[], page: number, pageSize: number): Page<T> {
  const size = toPositiveInteger(pageSize);
  const current = toPositiveInteger(page);
  const total = items.length;
  const start = (current - 1) * size;

  return {
    items: items.slice(start, start + size),
    page: current,
    pageSize: size,
    total,
    totalPages: Math.ceil(total / size),
  };
}

/** `NaN` e `Infinity` viram 1: sem isso o `page` do JSON sairia `null` e a UI mostraria nada. */
function toPositiveInteger(value: number): number {
  return Number.isFinite(value) ? Math.max(1, Math.floor(value)) : 1;
}
