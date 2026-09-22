import type { ReactNode } from 'react';
import styles from './Card.module.css';
import { cx } from './cx';

type CardElement = 'div' | 'section' | 'article' | 'li';
type Elevation = 'dp2' | 'dp6' | 'inner' | 'none';

interface CardProps {
  readonly as?: CardElement;
  /** Elevação da Figma: `dp2` para cards, `inner` para o contêiner branco da lista. */
  readonly elevation?: Elevation;
  readonly className?: string | undefined;
  readonly children: ReactNode;
}

/** Superfície branca com raio de 8 px e uma das elevações do style guide. */
export function Card({ as: Tag = 'div', elevation = 'dp2', className, children }: CardProps) {
  return <Tag className={cx(styles.card, styles[elevation], className)}>{children}</Tag>;
}
