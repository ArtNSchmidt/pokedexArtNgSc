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
 * de 1 são saturados em 1: a função é total.
 */
export function paginate<T>(items: readonly T[], page: number, pageSize: number): Page<T> {
  const size = Math.max(1, Math.floor(pageSize));
  const current = Math.max(1, Math.floor(page));
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
