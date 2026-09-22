import {
  LIST_DEFAULT_PAGE_SIZE,
  SEARCH_MAX_LENGTH,
  type PokemonListPage as ListPage,
} from '@pokedex/contracts';
import { describeError } from '../../shared/api/client';
import {
  Card,
  cx,
  EmptyState,
  ErrorState,
  Pagination,
  PokeballIcon,
  SearchInput,
  Skeleton,
} from '../../shared/ui';
import { PokemonCard } from './PokemonCard';
import { PokemonFilters } from './PokemonFilters';
import styles from './PokemonListPage.module.css';
import { usePokemonList } from './usePokemonList';

/** Tela Lista (§1): cabeçalho vermelho, busca + filtros e a grade dentro do card branco. */
export function PokemonListPage() {
  const list = usePokemonList();
  const { query } = list;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <PokeballIcon className={styles.logo} />
        <h1 className="t-headline">Pokédex</h1>
      </header>

      <div className={styles.toolbar}>
        <SearchInput
          value={list.searchText}
          onChange={list.setSearchText}
          label="Buscar Pokémon por nome"
          placeholder="Buscar"
          maxLength={SEARCH_MAX_LENGTH}
        />
        <PokemonFilters
          type={list.filters.type}
          generation={list.filters.generation}
          activeCount={list.activeFilterCount}
          onTypeChange={list.setType}
          onGenerationChange={list.setGeneration}
          onClear={list.clearFilters}
        />
      </div>

      <Card as="section" elevation="inner" className={styles.content}>
        {query.isPending ? (
          <SkeletonGrid />
        ) : query.isError ? (
          <ErrorState
            message={describeError(query.error)}
            onRetry={() => {
              void query.refetch();
            }}
          />
        ) : (
          <Results
            page={query.data}
            isStale={query.isPlaceholderData}
            onPageChange={list.setPage}
          />
        )}
      </Card>
    </div>
  );
}

interface ResultsProps {
  readonly page: ListPage;
  /** Página anterior ainda na tela enquanto a nova carrega (`keepPreviousData`). */
  readonly isStale: boolean;
  readonly onPageChange: (page: number) => void;
}

function Results({ page, isStale, onPageChange }: ResultsProps) {
  if (page.total === 0) {
    return (
      <EmptyState
        title="Nenhum Pokémon encontrado"
        description="Ajuste a busca ou os filtros e tente de novo."
      />
    );
  }

  return (
    <>
      <p className="visually-hidden" aria-live="polite">
        {page.total} Pokémon encontrados, página {page.page} de {page.totalPages}
      </p>
      <ul className={cx(styles.grid, isStale && styles.stale)} aria-busy={isStale}>
        {page.items.map((pokemon) => (
          <PokemonCard key={pokemon.id} pokemon={pokemon} />
        ))}
      </ul>
      <Pagination page={page.page} totalPages={page.totalPages} onPageChange={onPageChange} />
    </>
  );
}

function SkeletonGrid() {
  return (
    <div className={styles.grid} role="status" aria-label="Carregando Pokémon">
      {Array.from({ length: LIST_DEFAULT_PAGE_SIZE }, (_, index) => (
        <Skeleton key={index} height="6.75rem" />
      ))}
    </div>
  );
}
