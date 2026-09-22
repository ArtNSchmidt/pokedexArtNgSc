import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { pokemonDetailQuery } from '../../shared/api/queries';

/** Lê `:idOrName` da rota e busca o detalhe; a rota sempre traz o parâmetro, o `''` é só defesa de tipo. */
export function usePokemonDetail() {
  const { idOrName = '' } = useParams<{ idOrName: string }>();
  const query = useQuery({ ...pokemonDetailQuery(idOrName), enabled: idOrName.length > 0 });
  return { idOrName, query };
}
