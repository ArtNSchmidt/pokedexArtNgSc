import type { DamageMultiplier, TypeName, Weakness } from '@pokedex/contracts';
import { formatMultiplier } from '../../shared/format';
import { Badge } from '../../shared/ui';
import styles from './DetailPanels.module.css';

interface WeaknessPanelProps {
  readonly weaknesses: readonly Weakness[];
}

/** Agrupa por multiplicador preservando a ordem do contrato (decrescente, alfabética no empate). */
function groupByMultiplier(
  weaknesses: readonly Weakness[],
): readonly (readonly [DamageMultiplier, readonly TypeName[]])[] {
  const groups = new Map<DamageMultiplier, TypeName[]>();
  for (const weakness of weaknesses) {
    const types = groups.get(weakness.multiplier) ?? [];
    types.push(weakness.type);
    groups.set(weakness.multiplier, types);
  }
  return [...groups.entries()];
}

/** Fraquezas, resistências e imunidades, rotuladas `×4`, `×2`, `×½`, `×¼`, `imune` (§7.8). */
export function WeaknessPanel({ weaknesses }: WeaknessPanelProps) {
  const groups = groupByMultiplier(weaknesses);

  if (groups.length === 0) {
    return <p className={styles.muted}>Recebe dano neutro de todos os tipos.</p>;
  }

  return (
    <dl className={styles.groups}>
      {groups.map(([multiplier, types]) => (
        <div key={multiplier} className={styles.group}>
          <dt className={styles.groupLabel}>{formatMultiplier(multiplier)}</dt>
          <dd className={styles.groupBadges}>
            {types.map((type) => (
              <Badge key={type} type={type} />
            ))}
          </dd>
        </div>
      ))}
    </dl>
  );
}
