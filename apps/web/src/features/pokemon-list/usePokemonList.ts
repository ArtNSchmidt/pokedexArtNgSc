import {
  generationNameSchema,
  LIST_DEFAULT_PAGE,
  SEARCH_MAX_LENGTH,
  typeNameSchema,
  type GenerationName,
  type TypeName,
} from '@pokedex/contracts';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { pokemonListQuery, type PokemonListParams } from '../../shared/api/queries';

/** Debounce da busca (§7.8): o termo só vai para a URL e para a API depois desta pausa. */
export const SEARCH_DEBOUNCE_MS = 300;

/** Filtros da lista, sempre lidos da URL (`?q=&type=&generation=&page=`): voltar e compartilhar funcionam. */
export interface ListFilters {
  readonly q: string;
  readonly type: TypeName | '';
  readonly generation: GenerationName | '';
  readonly page: number;
}

const PARAM_Q = 'q';
const PARAM_TYPE = 'type';
const PARAM_GENERATION = 'generation';
const PARAM_PAGE = 'page';

/** Valores inválidos na URL (digitados à mão) são tratados como ausentes, nunca enviados ao BFF. */
export function readFilters(searchParams: URLSearchParams): ListFilters {
  const type = typeNameSchema.safeParse(searchParams.get(PARAM_TYPE));
  const generation = generationNameSchema.safeParse(searchParams.get(PARAM_GENERATION));
  const page = Number(searchParams.get(PARAM_PAGE));

  return {
    // Limitado ao máximo do contrato: uma URL digitada à mão com 100 caracteres viraria 400.
    q: (searchParams.get(PARAM_Q) ?? '').slice(0, SEARCH_MAX_LENGTH),
    type: type.success ? type.data : '',
    generation: generation.success ? generation.data : '',
    page: Number.isInteger(page) && page >= LIST_DEFAULT_PAGE ? page : LIST_DEFAULT_PAGE,
  };
}

/** Só parâmetros com valor entram na URL; página 1 fica implícita. */
export function writeFilters(filters: ListFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.q.length > 0) params.set(PARAM_Q, filters.q);
  if (filters.type !== '') params.set(PARAM_TYPE, filters.type);
  if (filters.generation !== '') params.set(PARAM_GENERATION, filters.generation);
  if (filters.page > LIST_DEFAULT_PAGE) params.set(PARAM_PAGE, String(filters.page));
  return params;
}

function toQueryParams(filters: ListFilters): PokemonListParams {
  // O termo vai aparado para a API: busca só com espaços equivale a busca nenhuma.
  const term = filters.q.trim();

  return {
    page: filters.page,
    ...(term.length > 0 ? { q: term } : {}),
    ...(filters.type !== '' ? { type: filters.type } : {}),
    ...(filters.generation !== '' ? { generation: filters.generation } : {}),
  };
}

/** Aplica o patch sobre os filtros que estiverem na URL no momento da navegação. */
function mergeFilters(patch: Partial<ListFilters>) {
  return (current: URLSearchParams): URLSearchParams =>
    writeFilters({ ...readFilters(current), ...patch });
}

export function usePokemonList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = readFilters(searchParams);
  const [searchText, setSearchText] = useState(filters.q);

  /** Navegação que entra no histórico: o botão voltar desfaz a troca de filtro ou de página. */
  const pushFilters = useCallback(
    (patch: Partial<ListFilters>) => {
      setSearchParams(mergeFilters(patch), { replace: false });
    },
    [setSearchParams],
  );

  /** Substitui a entrada atual: digitar na busca não deve gerar um item de histórico por tecla. */
  const replaceFilters = useCallback(
    (patch: Partial<ListFilters>) => {
      setSearchParams(mergeFilters(patch), { replace: true });
    },
    [setSearchParams],
  );

  // Trocar filtro volta para a página 1 — senão aparece "página 7 de 2" (§7.8).
  const setType = useCallback(
    (type: TypeName | '') => {
      pushFilters({ type, page: LIST_DEFAULT_PAGE });
    },
    [pushFilters],
  );
  const setGeneration = useCallback(
    (generation: GenerationName | '') => {
      pushFilters({ generation, page: LIST_DEFAULT_PAGE });
    },
    [pushFilters],
  );
  const setPage = useCallback(
    (page: number) => {
      pushFilters({ page });
    },
    [pushFilters],
  );
  const clearFilters = useCallback(() => {
    pushFilters({ type: '', generation: '', page: LIST_DEFAULT_PAGE });
  }, [pushFilters]);

  // O que se digita vai para a URL após a pausa.
  useEffect(() => {
    if (searchText === filters.q) return undefined;
    const timer = setTimeout(() => {
      replaceFilters({ q: searchText, page: LIST_DEFAULT_PAGE });
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
    };
  }, [searchText, filters.q, replaceFilters]);

  // O caminho inverso: voltar no histórico muda a URL e o campo acompanha. Ajuste de estado
  // derivado durante a renderização (padrão do React), sem efeito nem render em cascata.
  const [syncedQ, setSyncedQ] = useState(filters.q);
  if (syncedQ !== filters.q) {
    setSyncedQ(filters.q);
    setSearchText(filters.q);
  }

  const query = useQuery(pokemonListQuery(toQueryParams(filters)));
  const activeFilterCount = (filters.type === '' ? 0 : 1) + (filters.generation === '' ? 0 : 1);

  return {
    filters,
    searchText,
    setSearchText,
    setType,
    setGeneration,
    setPage,
    clearFilters,
    activeFilterCount,
    query,
  };
}
