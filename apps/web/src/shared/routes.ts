/**
 * Caminhos das rotas. Vivem em `shared/` — e não em `app/router.tsx` — porque as telas precisam
 * deles para montar links, e importá-los do módulo de composição criaria um ciclo
 * (`router` → tela → `router`).
 */
export const paths = {
  list: '/',
  detail: (idOrName: string | number): string => `/pokemon/${encodeURIComponent(String(idOrName))}`,
} as const;
