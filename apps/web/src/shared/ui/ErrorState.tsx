import { Button } from './Button';
import { PokeballIcon } from './icons';
import styles from './StateMessage.module.css';

interface ErrorStateProps {
  readonly title?: string;
  readonly message: string;
  readonly onRetry: () => void;
  readonly retryLabel?: string;
}

/** Estado de falha legível com ação de repetir (§1, tela Erro). Anunciado como `alert`. */
export function ErrorState({
  title = 'Algo deu errado',
  message,
  onRetry,
  retryLabel = 'Tentar de novo',
}: ErrorStateProps) {
  return (
    <div className={styles.state} role="alert">
      <PokeballIcon className={styles.icon} />
      <p className={styles.title}>{title}</p>
      <p className={styles.description}>{message}</p>
      <Button className={styles.action} onClick={onRetry}>
        {retryLabel}
      </Button>
    </div>
  );
}
