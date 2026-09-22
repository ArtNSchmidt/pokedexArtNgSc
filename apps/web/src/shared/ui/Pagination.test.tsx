import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Pagination } from './Pagination';

describe('Pagination', () => {
  it('mostra "Página X de Y" e navega com os botões', () => {
    const onPageChange = vi.fn();
    render(<Pagination page={2} totalPages={5} onPageChange={onPageChange} />);

    expect(screen.getByText('Página 2 de 5')).toBeInTheDocument();
    screen.getByRole('button', { name: 'Próxima página' }).click();
    screen.getByRole('button', { name: 'Página anterior' }).click();

    expect(onPageChange).toHaveBeenNthCalledWith(1, 3);
    expect(onPageChange).toHaveBeenNthCalledWith(2, 1);
  });

  it('desabilita os limites e não renderiza com uma página só', () => {
    const { rerender } = render(<Pagination page={1} totalPages={3} onPageChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Página anterior' })).toBeDisabled();

    rerender(<Pagination page={7} totalPages={2} onPageChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Próxima página' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Página anterior' })).toBeEnabled();

    rerender(<Pagination page={1} totalPages={1} onPageChange={vi.fn()} />);
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });
});
