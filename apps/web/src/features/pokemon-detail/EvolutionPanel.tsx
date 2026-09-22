import type { EvolutionStage, EvolutionStep, PokemonSummary } from '@pokedex/contracts';
import { Link } from 'react-router-dom';
import { paths } from '../../app/router';
import { humanizeSlug } from '../../shared/format';
import { ChevronRightIcon, cx } from '../../shared/ui';
import { describeEvolutionStep } from './describeEvolutionStep';
import styles from './DetailPanels.module.css';

interface EvolutionPanelProps {
  readonly steps: readonly EvolutionStep[];
  readonly stages: readonly EvolutionStage[];
  readonly currentId: number;
}

interface Branch {
  readonly from: string;
  readonly to: string;
  readonly conditions: readonly string[];
}

const CONDITION_SEPARATOR = ' ou ';
const STAGE_IMAGE_SIZE = 56;

/** Um ramo por par origem → destino; várias condições (Rattata à noite) viram "A ou B". */
function toBranches(steps: readonly EvolutionStep[]): Branch[] {
  const branches = new Map<string, { from: string; to: string; conditions: string[] }>();
  for (const step of steps) {
    const key = `${step.from}→${step.to}`;
    const branch = branches.get(key) ?? { from: step.from, to: step.to, conditions: [] };
    branch.conditions.push(describeEvolutionStep(step));
    branches.set(key, branch);
  }
  return [...branches.values()];
}

/**
 * Cadeia evolutiva a partir de `EvolutionStep[]` (arestas) e `EvolutionStage[]` (nós). Cada ramo
 * é uma linha; os 8 ramos de Eevee empilham no celular em vez de esticar a página (§7.8).
 */
export function EvolutionPanel({ steps, stages, currentId }: EvolutionPanelProps) {
  if (steps.length === 0) {
    return <p className={styles.muted}>Este Pokémon não evolui.</p>;
  }

  const stageBySpecies = new Map(stages.map((stage) => [stage.species, stage.pokemon]));

  return (
    <ul className={styles.branches}>
      {toBranches(steps).map((branch) => (
        <li key={`${branch.from}→${branch.to}`} className={styles.branch}>
          <StageCard
            species={branch.from}
            pokemon={stageBySpecies.get(branch.from)}
            currentId={currentId}
          />
          <div className={styles.condition}>
            <ChevronRightIcon className={styles.conditionArrow} />
            <span>{branch.conditions.join(CONDITION_SEPARATOR)}</span>
          </div>
          <StageCard
            species={branch.to}
            pokemon={stageBySpecies.get(branch.to)}
            currentId={currentId}
          />
        </li>
      ))}
    </ul>
  );
}

interface StageCardProps {
  readonly species: string;
  readonly pokemon: PokemonSummary | undefined;
  readonly currentId: number;
}

function StageCard({ species, pokemon, currentId }: StageCardProps) {
  if (pokemon === undefined) {
    return <span className={styles.stage}>{humanizeSlug(species)}</span>;
  }

  const isCurrent = pokemon.id === currentId;
  return (
    <Link
      to={paths.detail(pokemon.id)}
      className={cx(styles.stage, isCurrent && styles.stageCurrent)}
      aria-current={isCurrent ? 'page' : undefined}
    >
      <img
        src={pokemon.artworkUrl ?? pokemon.spriteUrl}
        alt=""
        width={STAGE_IMAGE_SIZE}
        height={STAGE_IMAGE_SIZE}
        loading="lazy"
        decoding="async"
      />
      <span className={styles.stageName}>{pokemon.displayName}</span>
    </Link>
  );
}
