import { Button } from './Button';
import { ChevronLeftIcon, ChevronRightIcon } from './icons';
import styles from './Pagination.module.css';

interface PaginationProps {
  readonly page: number;
  readonly totalPages: number;
  readonly onPageChange: (page: number) => void;
}

/** Anterior/próximo com "Página X de Y". Some com uma página só; segura "página 7 de 2" sem quebrar. */
export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages < 2) return null;

  return (
    <nav aria-label="Paginação" className={styles.nav}>
      <Button
        variant="icon"
        aria-label="Página anterior"
        disabled={page <= 1}
        onClick={() => {
          onPageChange(page - 1);
        }}
      >
        <ChevronLeftIcon />
      </Button>
      <span className={styles.status} aria-live="polite">
        Página {page} de {totalPages}
      </span>
      <Button
        variant="icon"
        aria-label="Próxima página"
        disabled={page >= totalPages}
        onClick={() => {
          onPageChange(page + 1);
        }}
      >
        <ChevronRightIcon />
      </Button>
    </nav>
  );
}
