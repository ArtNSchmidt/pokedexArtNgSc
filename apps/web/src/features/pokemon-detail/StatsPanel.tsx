import { MAX_BASE_STAT, type StatName, type StatValue } from '@pokedex/contracts';
import { StatBar } from '../../shared/ui';
import styles from './DetailPanels.module.css';

/** Rótulos curtos da Figma. */
const STAT_LABELS: Readonly<Record<StatName, string>> = {
  hp: 'HP',
  attack: 'ATK',
  defense: 'DEF',
  'special-attack': 'SATK',
  'special-defense': 'SDEF',
  speed: 'SPD',
};

interface StatsPanelProps {
  readonly stats: readonly StatValue[];
  readonly color: string;
}

/** Barras proporcionais a 255, o máximo teórico (§7.8). */
export function StatsPanel({ stats, color }: StatsPanelProps) {
  return (
    <div className={styles.stats}>
      {stats.map((stat) => (
        <StatBar
          key={stat.name}
          label={STAT_LABELS[stat.name]}
          value={stat.base}
          max={MAX_BASE_STAT}
          color={color}
        />
      ))}
    </div>
  );
}
