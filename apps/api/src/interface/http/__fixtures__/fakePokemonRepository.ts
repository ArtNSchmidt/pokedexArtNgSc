import {
  charizardDetail,
  GENERATION_OPTIONS,
  listPageFixture,
  TYPE_OPTIONS,
  type GenerationOption,
  type ListQuery,
  type PokemonDetail,
  type PokemonListPage,
  type TypeOption,
} from '@pokedex/contracts';
import {
  PokemonNotFoundError,
  UpstreamUnavailableError,
  type PokemonRepository,
} from '@pokedex/domain';

export const INDEX_SIZE = 1025;

/**
 * Repositório falso para testar a camada HTTP sem rede: responde com as fixtures do contrato e
 * simula os três modos de falha que o error handler precisa traduzir.
 */
export class FakePokemonRepository implements PokemonRepository {
  readonly receivedQueries: ListQuery[] = [];

  listPokemon(query: ListQuery): Promise<PokemonListPage> {
    this.receivedQueries.push(query);
    return Promise.resolve({ ...listPageFixture, page: query.page, pageSize: query.pageSize });
  }

  getPokemonDetail(idOrName: string): Promise<PokemonDetail> {
    if (idOrName === 'charizard' || idOrName === '6') return Promise.resolve(charizardDetail);
    if (idOrName === 'upstream-down') {
      return Promise.reject(new UpstreamUnavailableError('HTTP 503 em /pokemon/upstream-down'));
    }
    if (idOrName === 'boom') return Promise.reject(new Error('segredo interno: senha=123'));
    return Promise.reject(new PokemonNotFoundError(idOrName));
  }

  listTypes(): Promise<TypeOption[]> {
    return Promise.resolve([...TYPE_OPTIONS]);
  }

  listGenerations(): Promise<GenerationOption[]> {
    return Promise.resolve([...GENERATION_OPTIONS]);
  }

  indexSize(): number {
    return INDEX_SIZE;
  }
}
