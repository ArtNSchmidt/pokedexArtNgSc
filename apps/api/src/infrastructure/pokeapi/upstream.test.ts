import { UpstreamUnavailableError } from '@pokedex/domain';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import type { JsonHttpClient } from '../http/pokeApiClient.js';
import { fetchParsed } from './upstream.js';

const clientReturning = (body: unknown): JsonHttpClient => ({
  getJson: () => Promise.resolve(body),
});

const schema = z.object({ id: z.number(), name: z.string() });

describe('fetchParsed (validação na borda, §5.3)', () => {
  it('devolve o dado quando a resposta casa com o schema', async () => {
    await expect(
      fetchParsed(clientReturning({ id: 1, name: 'bulbasaur' }), '/pokemon/1', schema),
    ).resolves.toEqual({ id: 1, name: 'bulbasaur' });
  });

  it('resposta fora do schema vira UpstreamUnavailableError com caminho e campo', async () => {
    const error: unknown = await fetchParsed(
      clientReturning({ id: 'um' }),
      '/pokemon/1',
      schema,
    ).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(UpstreamUnavailableError);
    expect((error as Error).message).toContain('/pokemon/1');
    expect((error as Error).message).toContain('id');
  });

  it('não vaza o corpo do upstream na mensagem (§6.3)', async () => {
    const error: unknown = await fetchParsed(
      clientReturning({ segredo: 'token-interno' }),
      '/pokemon/1',
      schema,
    ).catch((caught: unknown) => caught);

    expect((error as Error).message).not.toContain('token-interno');
  });
});
