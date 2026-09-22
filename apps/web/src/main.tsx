import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import './styles/global.css';
import { AppProviders } from './app/providers';
import { createAppRouter } from './app/router';
import { PokemonDetailPage } from './features/pokemon-detail/PokemonDetailPage';
import { PokemonListPage } from './features/pokemon-list/PokemonListPage';

const router = createAppRouter({ ListPage: PokemonListPage, DetailPage: PokemonDetailPage });

const container = document.getElementById('root');
if (container === null) throw new Error('Elemento #root não encontrado em index.html');

createRoot(container).render(
  <StrictMode>
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  </StrictMode>,
);
