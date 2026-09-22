import { charizardDetail, eeveeDetail, sprigatitoDetail } from '@pokedex/contracts';
import { screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiError, installFakeApi, ok, renderApp } from '../testing/renderApp';
import { PokemonDetailPage } from './PokemonDetailPage';

const pages = { ListPage: () => <p>lista</p>, DetailPage: PokemonDetailPage };

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('PokemonDetailPage (§7.8)', () => {
  it('Charizard: cabeçalho, medidas, fraquezas agrupadas e evolução', async () => {
    installFakeApi({ '/pokemon/charizard': ok(charizardDetail) });
    renderApp(pages, '/pokemon/charizard');

    expect(await screen.findByRole('heading', { level: 1, name: 'Charizard' })).toBeInTheDocument();
    expect(screen.getByText('#006')).toBeInTheDocument();
    expect(screen.getByText('90,5 kg')).toBeInTheDocument();
    expect(screen.getByText('1,7 m')).toBeInTheDocument();

    const timesFour = screen.getByText('×4').parentElement;
    expect(timesFour).not.toBeNull();
    expect(within(timesFour ?? document.body).getByText('Pedra')).toBeInTheDocument();
    expect(screen.getByText('imune').parentElement).toHaveTextContent('Terrestre');

    expect(screen.getByText('Nível 36')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Charmander' })).toHaveAttribute('href', '/pokemon/4');
  });

  it('Eevee: 8 ramos a partir do mesmo Pokémon, cada destino com link', async () => {
    installFakeApi({ '/pokemon/eevee': ok(eeveeDetail) });
    renderApp(pages, '/pokemon/eevee');
    await screen.findByRole('heading', { level: 1, name: 'Eevee' });

    for (const name of [
      'Vaporeon',
      'Jolteon',
      'Flareon',
      'Espeon',
      'Umbreon',
      'Leafeon',
      'Glaceon',
      'Sylveon',
    ]) {
      expect(screen.getByRole('link', { name })).toBeInTheDocument();
    }
    expect(screen.getAllByRole('link', { name: 'Eevee' })).toHaveLength(8);
    expect(screen.getByText('Sobe de nível ou Usar Leaf Stone')).toBeInTheDocument();
  });

  it('Sprigatito: habitat null renderiza "—", nunca "null"', async () => {
    installFakeApi({ '/pokemon/906': ok(sprigatitoDetail) });
    renderApp(pages, '/pokemon/906');
    await screen.findByRole('heading', { level: 1, name: 'Sprigatito' });

    expect(screen.getByText('Habitat').parentElement).toHaveTextContent('—');
    expect(screen.queryByText(/null/)).not.toBeInTheDocument();
    expect(screen.getByText('Geração IX')).toBeInTheDocument();
  });

  it('404 mostra "Pokémon não encontrado" com caminho de volta', async () => {
    installFakeApi({
      '/pokemon/missingno': apiError(
        404,
        'POKEMON_NOT_FOUND',
        "Pokémon 'missingno' não encontrado.",
      ),
    });
    renderApp(pages, '/pokemon/missingno');

    expect(await screen.findByText('Pokémon não encontrado')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ver a lista completa' })).toBeInTheDocument();
  });

  it('erro do servidor mostra o ErrorState com retry', async () => {
    installFakeApi({ '/pokemon/6': apiError(502, 'UPSTREAM_UNAVAILABLE', 'Fonte indisponível.') });
    renderApp(pages, '/pokemon/6');

    expect(await screen.findByRole('alert')).toHaveTextContent('Fonte indisponível.');
    expect(screen.getByRole('button', { name: 'Tentar de novo' })).toBeInTheDocument();
  });
});
