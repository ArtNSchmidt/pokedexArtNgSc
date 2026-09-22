/**
 * Suporte de teste das telas: BFF falso no `fetch` global (respostas no formato do contrato) e o
 * app montado com roteador em memória. Só é importado por `*.test.tsx`; o Vite não o empacota.
 */
import { GENERATION_OPTIONS, TYPE_OPTIONS } from '@pokedex/contracts';
import { QueryClient } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { vi } from 'vitest';
import { AppProviders } from '../../app/providers';
import { createAppRoutes, type AppPages } from '../../app/router';
import { API_BASE_PATH, type FetchLike } from '../../shared/api/client';

export interface FakeReply {
  readonly status: number;
  readonly body: unknown;
}

export type FakeHandler = (search: URLSearchParams) => FakeReply;

export const ok = (body: unknown): FakeReply => ({ status: 200, body });

export const apiError = (status: number, code: string, message: string): FakeReply => ({
  status,
  body: { error: { code, message } },
});

const ROUTE_NOT_FOUND = apiError(404, 'ROUTE_NOT_FOUND', 'Rota não encontrada.');

export interface FakeApi {
  readonly handlers: Map<string, FakeHandler>;
  readonly calls: URL[];
  lastCall(path: string): URL | undefined;
}

/** Instala o BFF falso no `fetch` global; caminhos são relativos a `/api/v1`, sem query string. */
export function installFakeApi(initial: Record<string, FakeHandler | FakeReply>): FakeApi {
  const handlers = new Map<string, FakeHandler>();
  for (const [path, value] of Object.entries(initial)) {
    handlers.set(path, typeof value === 'function' ? value : () => value);
  }
  handlers.set('/types', handlers.get('/types') ?? (() => ok(TYPE_OPTIONS)));
  handlers.set('/generations', handlers.get('/generations') ?? (() => ok(GENERATION_OPTIONS)));

  const calls: URL[] = [];
  const fetchFake: FetchLike = (input) => {
    const url = new URL(input, 'http://test.local');
    calls.push(url);
    const handler = handlers.get(url.pathname.replace(API_BASE_PATH, ''));
    const reply = handler === undefined ? ROUTE_NOT_FOUND : handler(url.searchParams);
    return Promise.resolve({
      ok: reply.status < 400,
      status: reply.status,
      json: () => Promise.resolve(reply.body),
    });
  };
  vi.stubGlobal('fetch', fetchFake);

  return {
    handlers,
    calls,
    lastCall: (path) => calls.filter((url) => url.pathname === `${API_BASE_PATH}${path}`).at(-1),
  };
}

export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0, staleTime: 0 } },
  });
}

/** Monta as rotas do app com as telas dadas, começando em `path`. */
export function renderApp(pages: AppPages, path: string) {
  const router = createMemoryRouter(createAppRoutes(pages), { initialEntries: [path] });
  const result = render(
    <AppProviders client={createTestQueryClient()}>
      <RouterProvider router={router} />
    </AppProviders>,
  );
  return { ...result, router };
}
