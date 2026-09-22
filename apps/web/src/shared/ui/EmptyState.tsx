import type { ReactNode } from 'react';
import { PokeballIcon } from './icons';
import styles from './StateMessage.module.css';

interface EmptyStateProps {
  readonly title: string;
  readonly description?: string;
  readonly children?: ReactNode;
}

/** "Nenhum Pokémon encontrado": Pokéball cinza, título e uma dica de ação (§1, tela Vazio). */
export function EmptyState({ title, description, children }: EmptyStateProps) {
  return (
    <div className={styles.state} role="status">
      <PokeballIcon className={styles.icon} />
      <p className={styles.title}>{title}</p>
      {description === undefined ? null : <p className={styles.description}>{description}</p>}
      {children === undefined ? null : <div className={styles.action}>{children}</div>}
    </div>
  );
}
