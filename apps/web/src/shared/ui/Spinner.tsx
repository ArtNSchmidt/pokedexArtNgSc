import { cx } from './cx';
import styles from './Spinner.module.css';

interface SpinnerProps {
  readonly label?: string;
  readonly className?: string | undefined;
}

/** Anel giratório nas cores da identidade; anuncia o rótulo para leitores de tela. */
export function Spinner({ label = 'Carregando', className }: SpinnerProps) {
  return (
    <span role="status" className={cx(styles.spinner, className)}>
      <span className="visually-hidden">{label}</span>
    </span>
  );
}
