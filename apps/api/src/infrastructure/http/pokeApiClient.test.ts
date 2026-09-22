import { PokemonNotFoundError, UpstreamUnavailableError } from '@pokedex/domain';
import { describe, expect, it, vi } from 'vitest';
import { PokeApiClient, POKEAPI_BASE_URL, type FetchFunction } from './pokeApiClient.js';

const jsonResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

const clientWith = (fetchFn: FetchFunction) => new PokeApiClient({ fetchFn });

describe('PokeApiClient (fronteira HTTP → domínio)', () => {
  it('monta a URL a partir do base, pede JSON e devolve o corpo', async () => {
    const fetchFn = vi.fn<FetchFunction>(() =>
      Promise.resolve(jsonResponse({ name: 'bulbasaur' })),
    );

    await expect(clientWith(fetchFn).getJson('/pokemon/1')).resolves.toEqual({ name: 'bulbasaur' });

    const [url, init] = fetchFn.mock.calls[0] ?? [];
    expect(url).toBe(`${POKEAPI_BASE_URL}/pokemon/1`);
    expect(init?.headers).toEqual({ accept: 'application/json' });
    // O timeout de 8 s existe como AbortSignal, e não como corrida de promessas.
    expect(init?.signal).toBeInstanceOf(AbortSignal);
  });

  it('404 vira PokemonNotFoundError com o identificador pedido (§2.3.9)', async () => {
    const fetchFn = vi.fn<FetchFunction>(() =>
      Promise.resolve(jsonResponse({ status: 404, message: 'Not Found' }, 404)),
    );

    const error: unknown = await clientWith(fetchFn)
      .getJson('/pokemon/missingno')
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(PokemonNotFoundError);
    expect((error as PokemonNotFoundError).identifier).toBe('missingno');
  });

  it.each([500, 502, 503])('%i vira UpstreamUnavailableError', async (status) => {
    const fetchFn = vi.fn<FetchFunction>(() => Promise.resolve(jsonResponse({}, status)));

    await expect(clientWith(fetchFn).getJson('/pokemon/1')).rejects.toBeInstanceOf(
      UpstreamUnavailableError,
    );
  });

  it('falha de rede e timeout viram UpstreamUnavailableError preservando a causa', async () => {
    const cause = new DOMException('The operation was aborted.', 'TimeoutError');
    const fetchFn = vi.fn<FetchFunction>(() => Promise.reject(cause));

    const error: unknown = await clientWith(fetchFn)
      .getJson('/pokemon/1')
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(UpstreamUnavailableError);
    expect((error as Error).cause).toBe(cause);
  });

  it('resposta 200 que não é JSON vira UpstreamUnavailableError', async () => {
    const fetchFn = vi.fn<FetchFunction>(() =>
      Promise.resolve(new Response('<html>oops</html>', { status: 200 })),
    );

    await expect(clientWith(fetchFn).getJson('/pokemon/1')).rejects.toBeInstanceOf(
      UpstreamUnavailableError,
    );
  });
});
