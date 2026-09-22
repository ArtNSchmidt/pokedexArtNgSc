import {
  generationOptionSchema,
  pokemonDetailSchema,
  pokemonListPageSchema,
  typeOptionSchema,
  type GenerationName,
  type TypeName,
} from '@pokedex/contracts';
import { keepPreviousData, queryOptions } from '@tanstack/react-query';
import { z } from 'zod';
import { apiGet } from './client';

/** Dados que mudam raramente: 5 min sem refetch (§7.7). */
export const STALE_TIME_MS = 5 * 60 * 1_000;

/** Lado "entrada" de `listQuerySchema`: o que a UI manda; o BFF aplica defaults e valida. */
export interface PokemonListParams {
  readonly page?: number;
  readonly pageSize?: number;
  readonly q?: string;
  readonly type?: TypeName;
  readonly generation?: GenerationName;
}

export function toListSearchParams(params: PokemonListParams): URLSearchParams {
  const search = new URLSearchParams();
  if (params.page !== undefined) search.set('page', String(params.page));
  if (params.pageSize !== undefined) search.set('pageSize', String(params.pageSize));
  if (params.q !== undefined && params.q.length > 0) search.set('q', params.q);
  if (params.type !== undefined) search.set('type', params.type);
  if (params.generation !== undefined) search.set('generation', params.generation);
  return search;
}

export const queryKeys = {
  pokemonList: (params: PokemonListParams) => ['pokemon', 'list', params] as const,
  pokemonDetail: (idOrName: string) => ['pokemon', 'detail', idOrName] as const,
  types: ['catalog', 'types'] as const,
  generations: ['catalog', 'generations'] as const,
};

/** Mantém a página anterior visível enquanto a próxima carrega (sem piscar o skeleton). */
export function pokemonListQuery(params: PokemonListParams) {
  return queryOptions({
    queryKey: queryKeys.pokemonList(params),
    queryFn: ({ signal }) =>
      apiGet(`/pokemon?${toListSearchParams(params).toString()}`, pokemonListPageSchema, {
        signal,
      }),
    placeholderData: keepPreviousData,
    staleTime: STALE_TIME_MS,
  });
}

export function pokemonDetailQuery(idOrName: string) {
  return queryOptions({
    queryKey: queryKeys.pokemonDetail(idOrName),
    queryFn: ({ signal }) =>
      apiGet(`/pokemon/${encodeURIComponent(idOrName)}`, pokemonDetailSchema, { signal }),
    staleTime: STALE_TIME_MS,
  });
}

export const typesQuery = queryOptions({
  queryKey: queryKeys.types,
  queryFn: ({ signal }) => apiGet('/types', z.array(typeOptionSchema), { signal }),
  staleTime: STALE_TIME_MS,
});

export const generationsQuery = queryOptions({
  queryKey: queryKeys.generations,
  queryFn: ({ signal }) => apiGet('/generations', z.array(generationOptionSchema), { signal }),
  staleTime: STALE_TIME_MS,
});
