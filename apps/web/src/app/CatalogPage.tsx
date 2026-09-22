/**
 * Página temporária do A5 (§7.7): renderiza cada componente do design system nos seus estados
 * para o print em 360 px. **Removida antes do merge final** — não é tela do produto.
 */
import { MAX_BASE_STAT, TYPE_NAMES, TYPE_OPTIONS } from '@pokedex/contracts';
import { useRef, useState } from 'react';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  IconLink,
  Pagination,
  PokeballIcon,
  Popover,
  SearchInput,
  Select,
  Skeleton,
  Spinner,
  StatBar,
  TuneIcon,
  WeightIcon,
} from '../shared/ui';
import styles from './CatalogPage.module.css';
import { paths } from './router';

const TOTAL_PAGES_SAMPLE = 5;
const SAMPLE_STATS = [
  { label: 'HP', value: 78 },
  { label: 'ATK', value: 84 },
  { label: 'SATK', value: 109 },
  { label: 'SPD', value: 255 },
];

export function CatalogPage() {
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtersTrigger = useRef<HTMLButtonElement>(null);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <PokeballIcon className={styles.logo} />
        <h1 className="t-headline">Catálogo A5</h1>
      </header>

      <div className={styles.toolbar}>
        <SearchInput value={search} onChange={setSearch} label="Buscar" placeholder="Buscar" />
        <div className={styles.popoverAnchor}>
          <Button
            ref={filtersTrigger}
            variant="icon"
            aria-label="Filtros"
            aria-expanded={filtersOpen}
            onClick={() => {
              setFiltersOpen((open) => !open);
            }}
          >
            <TuneIcon />
          </Button>
          <Popover
            open={filtersOpen}
            onClose={() => {
              setFiltersOpen(false);
            }}
            label="Filtros"
            triggerRef={filtersTrigger}
          >
            <Select
              id="catalog-type"
              label="Tipo"
              value={type}
              placeholder="Todos os tipos"
              options={TYPE_OPTIONS.map((option) => ({
                value: option.name,
                label: option.displayName,
              }))}
              onChange={setType}
            />
            <Button variant="ghost" onClick={() => setType('')}>
              Limpar
            </Button>
          </Popover>
        </div>
      </div>

      <Card elevation="inner" className={styles.section}>
        <h2 className="t-subtitle-1">Chips de tipo</h2>
        <div className={styles.row}>
          {TYPE_NAMES.map((name) => (
            <Badge key={name} type={name} />
          ))}
        </div>
        <div className={styles.row}>
          <Badge type="fire" size="md" />
          <Badge type="water" size="md" />
        </div>
      </Card>

      <Card elevation="inner" className={styles.section}>
        <h2 className="t-subtitle-1">Botões e navegação</h2>
        <div className={styles.row}>
          <Button>Primário</Button>
          <Button disabled>Desabilitado</Button>
          <Button variant="ghost">Fantasma</Button>
          <IconLink to={paths.detail(6)} label="Exemplo de link com ícone">
            <WeightIcon />
          </IconLink>
        </div>
        <Pagination page={page} totalPages={TOTAL_PAGES_SAMPLE} onPageChange={setPage} />
      </Card>

      <Card elevation="inner" className={styles.section}>
        <h2 className="t-subtitle-1">Stats</h2>
        {SAMPLE_STATS.map((stat) => (
          <StatBar
            key={stat.label}
            label={stat.label}
            value={stat.value}
            max={MAX_BASE_STAT}
            color="var(--type-fire)"
          />
        ))}
      </Card>

      <Card elevation="inner" className={styles.section}>
        <h2 className="t-subtitle-1">Carregando</h2>
        <div className={styles.row}>
          <Spinner />
          <Skeleton width="6rem" height="1rem" />
          <Skeleton width="4.5rem" height="4.5rem" />
        </div>
      </Card>

      <Card elevation="inner" className={styles.section}>
        <EmptyState
          title="Nenhum Pokémon encontrado"
          description="Ajuste a busca ou os filtros e tente de novo."
        />
      </Card>

      <Card elevation="inner" className={styles.section}>
        <ErrorState
          message="Não foi possível falar com o servidor."
          onRetry={() => {
            setPage(1);
          }}
        />
      </Card>
    </div>
  );
}
