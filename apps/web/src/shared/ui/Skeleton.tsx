import type { CSSProperties } from 'react';
import { cx } from './cx';
import styles from './Skeleton.module.css';

interface SkeletonProps {
  readonly width?: string;
  readonly height?: string;
  readonly className?: string | undefined;
}

/** Bloco cinza pulsante para o estado de carregamento; sempre `aria-hidden`, o texto vem do contêiner. */
export function Skeleton({ width, height, className }: SkeletonProps) {
  const style: CSSProperties = {};
  if (width !== undefined) style.width = width;
  if (height !== undefined) style.height = height;

  return <span aria-hidden="true" className={cx(styles.skeleton, className)} style={style} />;
}
