import { useEffect, useRef, type ReactNode, type RefObject } from 'react';
import { cx } from './cx';
import styles from './Popover.module.css';

interface PopoverProps {
  readonly open: boolean;
  readonly onClose: () => void;
  /** Título branco no topo do container vermelho (Figma: "Sort by:" → aqui "Filtros"). */
  readonly label: string;
  /** Elemento que abre o popover; cliques nele não contam como "fora". */
  readonly triggerRef?: RefObject<HTMLElement | null>;
  readonly className?: string | undefined;
  readonly children: ReactNode;
}

/**
 * Popup da Figma: container vermelho (raio 12) com título e card branco interno. Posicionado por
 * CSS em relação ao pai (`position: relative`). Fecha com Escape ou clique fora.
 */
export function Popover({ open, onClose, label, triggerRef, className, children }: PopoverProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return undefined;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    const closeOnOutsideClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      const insidePanel = panelRef.current?.contains(target) ?? false;
      const insideTrigger = triggerRef?.current?.contains(target) ?? false;
      if (!insidePanel && !insideTrigger) onClose();
    };

    document.addEventListener('keydown', closeOnEscape);
    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => {
      document.removeEventListener('keydown', closeOnEscape);
      document.removeEventListener('mousedown', closeOnOutsideClick);
    };
  }, [open, onClose, triggerRef]);

  if (!open) return null;

  return (
    <div ref={panelRef} role="dialog" aria-label={label} className={cx(styles.popover, className)}>
      <p className={styles.title}>{label}</p>
      <div className={styles.body}>{children}</div>
    </div>
  );
}
