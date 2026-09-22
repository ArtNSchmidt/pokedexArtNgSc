import { useNavigate } from 'react-router-dom';
import { Card, ErrorState } from '../shared/ui';

const RELOAD_CURRENT_ROUTE = 0;

/** Último recurso do roteador: erro de renderização fora dos estados tratados pelas telas. */
export function RouteErrorPage() {
  const navigate = useNavigate();

  return (
    <Card elevation="inner">
      <ErrorState
        message="A tela encontrou um problema inesperado."
        onRetry={() => {
          void navigate(RELOAD_CURRENT_ROUTE);
        }}
      />
    </Card>
  );
}
