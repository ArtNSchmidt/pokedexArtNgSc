import { Link } from 'react-router-dom';
import { Card, EmptyState } from '../shared/ui';
import { paths } from './router';

export function NotFoundPage() {
  return (
    <Card elevation="inner">
      <EmptyState title="Página não encontrada" description="Esse caminho não existe na Pokédex.">
        <Link to={paths.list}>Voltar para a lista</Link>
      </EmptyState>
    </Card>
  );
}
