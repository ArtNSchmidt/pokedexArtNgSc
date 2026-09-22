import type { ComponentProps } from 'react';
import styles from './Button.module.css';
import { cx } from './cx';

type Variant = 'primary' | 'ghost' | 'icon';

/** `ComponentProps` inclui `ref`: no React 19 ela chega como prop comum, sem forwardRef. */
interface ButtonProps extends Omit<ComponentProps<'button'>, 'className'> {
  readonly variant?: Variant;
  readonly className?: string | undefined;
}

/**
 * Botão com os três usos da interface: ação primária (vermelho, 44 px), fantasma (texto) e ícone
 * (círculo branco de 32 px da Figma, com área de toque de 44 px por `::before`).
 */
export function Button({ variant = 'primary', className, type = 'button', ...rest }: ButtonProps) {
  return <button type={type} className={cx(styles.button, styles[variant], className)} {...rest} />;
}
