import { POKEDEX_FIRST_ID, POKEDEX_LAST_ID, type PokemonDetail } from '@pokedex/contracts';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { paths } from '../../shared/routes';
import { describeError, isNotFoundError } from '../../shared/api/client';
import {
  formatGeneration,
  formatKilograms,
  formatMeters,
  formatPokedexNumber,
  humanizeSlug,
  orPlaceholder,
} from '../../shared/format';
import {
  ArrowBackIcon,
  Badge,
  Button,
  Card,
  ChevronLeftIcon,
  ChevronRightIcon,
  cx,
  EmptyState,
  ErrorState,
  PokeballIcon,
  Skeleton,
  StraightenIcon,
  VolumeIcon,
  WeightIcon,
} from '../../shared/ui';
import { AbilitiesPanel } from './AbilitiesPanel';
import { EvolutionPanel } from './EvolutionPanel';
import styles from './PokemonDetailPage.module.css';
import { StatsPanel } from './StatsPanel';
import { usePokemonDetail } from './usePokemonDetail';
import { WeaknessPanel } from './WeaknessPanel';

const ARTWORK_SIZE = 200;

/** Tela Detalhe (§1): fundo na cor do primeiro tipo, artwork sobre o card branco, seções em ordem. */
export function PokemonDetailPage() {
  const { idOrName, query } = usePokemonDetail();

  if (query.isPending) return <DetailSkeleton />;

  if (query.isError) {
    return isNotFoundError(query.error) ? (
      <NeutralPage>
        <EmptyState
          title="Pokémon não encontrado"
          description={`Não existe "${idOrName}" na Pokédex nacional.`}
        >
          <Link to={paths.list}>Ver a lista completa</Link>
        </EmptyState>
      </NeutralPage>
    ) : (
      <NeutralPage>
        <ErrorState
          message={describeError(query.error)}
          onRetry={() => {
            void query.refetch();
          }}
        />
      </NeutralPage>
    );
  }

  return <DetailView pokemon={query.data} />;
}

function DetailView({ pokemon }: { readonly pokemon: PokemonDetail }) {
  const primaryType = pokemon.types[0] ?? 'normal';
  const color = `var(--type-${primaryType})`;
  const ink = `var(--type-${primaryType}-ink)`;
  // Sobre o card branco a cor viva do tipo chega a 1,5:1 (electric): texto usa a variante escura.
  const textColor = `var(--type-${primaryType}-deep)`;

  return (
    <article className={styles.page} style={{ background: color, color: ink }}>
      <header className={styles.header}>
        <BackLink />
        <h1 className={cx('t-headline', styles.title)}>{pokemon.displayName}</h1>
        <span className={cx('t-subtitle-2', styles.number)}>{formatPokedexNumber(pokemon.id)}</span>
      </header>
      <PokeballIcon className={styles.watermark} />

      <div className={styles.artworkRow}>
        <NeighborLink id={pokemon.id - 1} label="Pokémon anterior">
          <ChevronLeftIcon />
        </NeighborLink>
        <img
          className={styles.artwork}
          src={pokemon.artworkUrl ?? pokemon.spriteUrl}
          alt={`Artwork de ${pokemon.displayName}`}
          width={ARTWORK_SIZE}
          height={ARTWORK_SIZE}
        />
        <NeighborLink id={pokemon.id + 1} label="Próximo Pokémon">
          <ChevronRightIcon />
        </NeighborLink>
      </div>

      <Card as="section" className={styles.card}>
        <div className={styles.types}>
          {pokemon.types.map((type) => (
            <Badge key={type} type={type} size="md" />
          ))}
          {pokemon.cryUrl === null ? null : (
            <CryButton url={pokemon.cryUrl} name={pokemon.displayName} />
          )}
        </div>

        <SectionTitle color={textColor}>Sobre</SectionTitle>
        <AboutPanel pokemon={pokemon} />

        <SectionTitle color={textColor}>Estatísticas base</SectionTitle>
        <StatsPanel stats={pokemon.stats} color={color} labelColor={textColor} />

        <SectionTitle color={textColor}>Fraquezas e resistências</SectionTitle>
        <WeaknessPanel weaknesses={pokemon.weaknesses} />

        <SectionTitle color={textColor}>Habilidades</SectionTitle>
        <AbilitiesPanel abilities={pokemon.abilities} />

        <SectionTitle color={textColor}>Evolução</SectionTitle>
        <EvolutionPanel
          steps={pokemon.evolution}
          stages={pokemon.evolutionStages}
          currentId={pokemon.id}
        />
      </Card>
    </article>
  );
}

/** O mesmo link de volta aparece no detalhe, no erro e no skeleton — um componente, três usos. */
function BackLink() {
  return (
    <Link to={paths.list} aria-label="Voltar para a lista" className={styles.back}>
      <ArrowBackIcon />
    </Link>
  );
}

function NeighborLink({
  id,
  label,
  children,
}: {
  readonly id: number;
  readonly label: string;
  readonly children: ReactNode;
}) {
  if (id < POKEDEX_FIRST_ID || id > POKEDEX_LAST_ID) {
    return <span className={styles.neighborSpacer} aria-hidden="true" />;
  }
  return (
    <Link to={paths.detail(id)} aria-label={label} className={styles.neighbor}>
      {children}
    </Link>
  );
}

function CryButton({ url, name }: { readonly url: string; readonly name: string }) {
  return (
    <Button
      variant="icon"
      className={styles.cry}
      aria-label={`Ouvir o grito de ${name}`}
      onClick={() => {
        void new Audio(url).play().catch(() => undefined);
      }}
    >
      <VolumeIcon />
    </Button>
  );
}

function SectionTitle({
  color,
  children,
}: {
  readonly color: string;
  readonly children: ReactNode;
}) {
  return (
    <h2 className={cx('t-subtitle-1', styles.sectionTitle)} style={{ color }}>
      {children}
    </h2>
  );
}

function AboutPanel({ pokemon }: { readonly pokemon: PokemonDetail }) {
  return (
    <>
      <div className={styles.specs}>
        <Spec label="Peso" icon={<WeightIcon />} value={formatKilograms(pokemon.weightKilograms)} />
        <Spec label="Altura" icon={<StraightenIcon />} value={formatMeters(pokemon.heightMeters)} />
        <div className={styles.spec}>
          <ul className={styles.specValue}>
            {pokemon.abilities.length === 0 ? (
              <li>—</li>
            ) : (
              pokemon.abilities.map((ability) => (
                <li key={ability.name} className={styles.specLine}>
                  {ability.displayName}
                </li>
              ))
            )}
          </ul>
          <span className={styles.specLabel}>Habilidades</span>
        </div>
      </div>

      <p className={styles.flavor}>{orPlaceholder(pokemon.flavorText)}</p>

      <dl className={styles.meta}>
        <MetaItem label="Categoria" value={orPlaceholder(pokemon.genus)} />
        <MetaItem label="Geração" value={formatGeneration(pokemon.generation)} />
        <MetaItem
          label="Habitat"
          value={orPlaceholder(pokemon.habitat === null ? null : humanizeSlug(pokemon.habitat))}
        />
        {pokemon.isLegendary ? <MetaItem label="Raridade" value="Lendário" /> : null}
        {pokemon.isMythical ? <MetaItem label="Raridade" value="Mítico" /> : null}
      </dl>
    </>
  );
}

function Spec({
  label,
  icon,
  value,
}: {
  readonly label: string;
  readonly icon: ReactNode;
  readonly value: string;
}) {
  return (
    <div className={styles.spec}>
      <span className={styles.specValue}>
        {icon}
        {value}
      </span>
      <span className={styles.specLabel}>{label}</span>
    </div>
  );
}

function MetaItem({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className={styles.metaItem}>
      <dt className={styles.metaLabel}>{label}</dt>
      <dd className={styles.metaValue}>{value}</dd>
    </div>
  );
}

function NeutralPage({ children }: { readonly children: ReactNode }) {
  return (
    <div className={styles.neutral}>
      <header className={styles.header}>
        <BackLink />
        <h1 className="t-headline">Pokédex</h1>
      </header>
      <Card elevation="inner" className={styles.card}>
        {children}
      </Card>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className={styles.neutral} role="status" aria-label="Carregando Pokémon">
      <header className={styles.header}>
        <BackLink />
        <Skeleton width="10rem" height="1.5rem" className={styles.skeletonOnColor} />
      </header>
      <div className={styles.artworkRow}>
        <span className={styles.neighborSpacer} />
        <Skeleton width="12.5rem" height="12.5rem" className={styles.skeletonOnColor} />
        <span className={styles.neighborSpacer} />
      </div>
      <Card as="section" className={styles.card}>
        <Skeleton width="8rem" height="1.75rem" />
        <Skeleton height="4rem" />
        <Skeleton height="6rem" />
        <Skeleton height="8rem" />
      </Card>
    </div>
  );
}
