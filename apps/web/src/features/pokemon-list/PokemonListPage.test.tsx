import { emptyListPageFixture, listPageFixture, SEARCH_MAX_LENGTH } from '@pokedex/contracts';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiError, installFakeApi, ok, renderApp } from '../testing/renderApp';
import { PokemonListPage } from './PokemonListPage';

const pages = { ListPage: PokemonListPage, DetailPage: () => <p>detalhe</p> };

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('PokemonListPage (§7.8)', () => {
  it('mostra o skeleton e depois a grade com os 24 cards', async () => {
    installFakeApi({ '/pokemon': ok(listPageFixture) });
    renderApp(pages, '/');

    expect(screen.getByRole('status', { name: 'Carregando Pokémon' })).toBeInTheDocument();
    expect(await screen.findByText('Bulbasaur')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /#0\d\d/ })).toHaveLength(24);
    expect(screen.getByText('Página 1 de 43')).toBeInTheDocument();
  });

  it('total zero mostra "Nenhum Pokémon encontrado"', async () => {
    installFakeApi({ '/pokemon': ok(emptyListPageFixture) });
    renderApp(pages, '/?q=zzz');

    expect(await screen.findByText('Nenhum Pokémon encontrado')).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Paginação' })).not.toBeInTheDocument();
  });

  it('erro do servidor mostra o ErrorState e "Tentar de novo" refaz a busca', async () => {
    const api = installFakeApi({
      '/pokemon': apiError(502, 'UPSTREAM_UNAVAILABLE', 'A fonte de dados está indisponível.'),
    });
    renderApp(pages, '/');

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'A fonte de dados está indisponível.',
    );

    api.handlers.set('/pokemon', () => ok(listPageFixture));
    fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }));

    expect(await screen.findByText('Bulbasaur')).toBeInTheDocument();
  });

  it('a busca vai para a URL com debounce e volta para a página 1', async () => {
    const api = installFakeApi({ '/pokemon': ok(listPageFixture) });
    const { router } = renderApp(pages, '/?page=3');
    await screen.findByText('Bulbasaur');

    fireEvent.change(screen.getByRole('textbox', { name: 'Buscar Pokémon por nome' }), {
      target: { value: 'pika' },
    });

    await waitFor(() => {
      expect(router.state.location.search).toBe('?q=pika');
    });
    await waitFor(() => {
      expect(api.lastCall('/pokemon')?.searchParams.get('q')).toBe('pika');
    });
    expect(api.lastCall('/pokemon')?.searchParams.get('page')).toBe('1');
  });

  it('busca só com espaços não vira filtro: a lista continua completa', async () => {
    const api = installFakeApi({ '/pokemon': ok(listPageFixture) });
    renderApp(pages, '/?q=%20%20%20');
    await screen.findByText('Bulbasaur');

    expect(api.lastCall('/pokemon')?.searchParams.get('q')).toBeNull();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('q acima do limite do contrato é aparado antes de ir ao BFF', async () => {
    const api = installFakeApi({ '/pokemon': ok(listPageFixture) });
    renderApp(pages, `/?q=${'x'.repeat(SEARCH_MAX_LENGTH + 10)}`);
    await screen.findByText('Bulbasaur');

    expect(api.lastCall('/pokemon')?.searchParams.get('q')).toHaveLength(SEARCH_MAX_LENGTH);
  });

  it('página além do total explica o que houve e oferece caminho de volta', async () => {
    installFakeApi({
      '/pokemon': ok({ ...listPageFixture, items: [], page: 99, total: 1025, totalPages: 43 }),
    });
    const { router } = renderApp(pages, '/?page=99');

    expect(await screen.findByText('Página sem resultados')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Ir para a primeira página' }));

    await waitFor(() => {
      expect(router.state.location.search).toBe('');
    });
  });

  it('trocar o filtro de tipo volta para a página 1', async () => {
    const api = installFakeApi({ '/pokemon': ok(listPageFixture) });
    const { router } = renderApp(pages, '/?page=3');
    await screen.findByText('Bulbasaur');

    fireEvent.click(screen.getByRole('button', { name: 'Filtros' }));
    fireEvent.change(await screen.findByLabelText('Tipo'), { target: { value: 'fire' } });

    await waitFor(() => {
      expect(router.state.location.search).toBe('?type=fire');
    });
    await waitFor(() => {
      expect(api.lastCall('/pokemon')?.searchParams.get('page')).toBe('1');
    });
  });

  it('filtros na URL chegam ao BFF e valores inválidos são ignorados', async () => {
    const api = installFakeApi({ '/pokemon': ok(listPageFixture) });
    renderApp(pages, '/?type=grass&generation=banana&page=2');
    await screen.findByText('Bulbasaur');

    const call = api.lastCall('/pokemon');
    expect(call?.searchParams.get('type')).toBe('grass');
    expect(call?.searchParams.get('generation')).toBeNull();
    expect(call?.searchParams.get('page')).toBe('2');
    expect(screen.getByRole('button', { name: 'Filtros (1 ativos)' })).toBeInTheDocument();
  });
});
