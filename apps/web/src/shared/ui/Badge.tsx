import { TYPE_DISPLAY_NAMES, type TypeName } from '@pokedex/contracts';
import styles from './Badge.module.css';
import { cx } from './cx';

interface BadgeProps {
  readonly type: TypeName;
  readonly size?: 'sm' | 'md';
  readonly className?: string | undefined;
}

/** Chip de tipo da Figma: fundo `--type-<nome>`, texto `--type-<nome>-ink`, rótulo em PT-BR. */
export function Badge({ type, size = 'sm', className }: BadgeProps) {
  return (
    <span
      className={cx(styles.badge, size === 'md' && styles.md, className)}
      style={{ background: `var(--type-${type})`, color: `var(--type-${type}-ink)` }}
    >
      {TYPE_DISPLAY_NAMES[type]}
    </span>
  );
}
