import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ErrorState } from './ErrorState';

describe('ErrorState', () => {
  it('anuncia a mensagem como alerta e oferece "Tentar de novo"', () => {
    const onRetry = vi.fn();
    render(<ErrorState message="Falhou" onRetry={onRetry} />);

    expect(screen.getByRole('alert')).toHaveTextContent('Falhou');
    screen.getByRole('button', { name: 'Tentar de novo' }).click();

    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
