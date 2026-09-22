import { formatStatValue } from '../format';
import styles from './StatBar.module.css';

interface StatBarProps {
  readonly label: string;
  readonly value: number;
  /** Referência da barra: 255, o máximo teórico de um stat base (§7.8). */
  readonly max: number;
  /** Cor CSS do preenchimento e da trilha (ex.: `var(--type-fire)`). */
  readonly color: string;
  /** Cor CSS do rótulo; padrão é a mesma do preenchimento, que nem sempre é legível sobre branco. */
  readonly labelColor?: string;
}

const TRACK_OPACITY_PERCENT = 24;
const FULL_PERCENT = 100;

/** Linha de stat da Figma: rótulo colorido | divisor | valor com 3 dígitos | barra de 4 px proporcional. */
export function StatBar({ label, value, max, color, labelColor }: StatBarProps) {
  const percent = max <= 0 ? 0 : Math.min(FULL_PERCENT, (value / max) * FULL_PERCENT);

  return (
    <div className={styles.row}>
      <span className={styles.label} style={{ color: labelColor ?? color }}>
        {label}
      </span>
      <span className={styles.value}>{formatStatValue(value)}</span>
      <div
        className={styles.track}
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
        style={{
          background: `color-mix(in srgb, ${color} ${String(TRACK_OPACITY_PERCENT)}%, transparent)`,
        }}
      >
        <div className={styles.fill} style={{ width: `${String(percent)}%`, background: color }} />
      </div>
    </div>
  );
}
