import type { AbilityView } from '@pokedex/contracts';
import { orPlaceholder } from '../../shared/format';
import styles from './DetailPanels.module.css';

interface AbilitiesPanelProps {
  readonly abilities: readonly AbilityView[];
}

/** Nome, selo de oculta e o efeito resumido de `GET /ability` (endpoint 5); sem texto → "—". */
export function AbilitiesPanel({ abilities }: AbilitiesPanelProps) {
  if (abilities.length === 0) {
    return <p className={styles.muted}>—</p>;
  }

  return (
    <ul className={styles.abilities}>
      {abilities.map((ability) => (
        <li key={ability.name} className={styles.ability}>
          <div className={styles.abilityHeading}>
            <span className="t-subtitle-2">{ability.displayName}</span>
            {ability.isHidden ? <span className={styles.tag}>oculta</span> : null}
          </div>
          <p className={styles.abilityEffect}>{orPlaceholder(ability.shortEffect)}</p>
        </li>
      ))}
    </ul>
  );
}
