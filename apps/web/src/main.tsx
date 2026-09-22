import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import './styles/global.css';
import { CatalogPage } from './app/CatalogPage';
import { AppProviders } from './app/providers';
import { createAppRouter } from './app/router';

// Página temporária do A5 nas duas rotas até o A6 entregar as telas (§7.7).
const router = createAppRouter({ ListPage: CatalogPage, DetailPage: CatalogPage });

const container = document.getElementById('root');
if (container === null) throw new Error('Elemento #root não encontrado em index.html');

createRoot(container).render(
  <StrictMode>
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  </StrictMode>,
);
