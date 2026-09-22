import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import {
  ApiClientError,
  ApiContractError,
  apiGet,
  describeError,
  isRetryableError,
  type FetchLike,
} from './client';

const schema = z.object({ name: z.string() });

function fetchReturning(status: number, body: unknown): FetchLike {
  return vi.fn<FetchLike>(() =>
    Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(body),
    }),
  );
}

describe('apiGet (§7.7: resposta fora do contrato é erro, não any)', () => {
  it('devolve o dado validado e chama o prefixo /api/v1', async () => {
    const fetchFn = fetchReturning(200, { name: 'pikachu' });

    await expect(apiGet('/pokemon/pikachu', schema, { fetchFn })).resolves.toEqual({
      name: 'pikachu',
    });
    expect(fetchFn).toHaveBeenCalledWith('/api/v1/pokemon/pikachu', expect.anything());
  });

  it('traduz o erro de §6.3 para ApiClientError com código e status', async () => {
    const fetchFn = fetchReturning(404, {
      error: { code: 'POKEMON_NOT_FOUND', message: "Pokémon 'missingno' não encontrado." },
    });

    const error = await apiGet('/pokemon/missingno', schema, { fetchFn }).catch(
      (caught: unknown) => caught,
    );

    expect(error).toBeInstanceOf(ApiClientError);
    expect(error).toMatchObject({ code: 'POKEMON_NOT_FOUND', status: 404 });
    expect(describeError(error)).toBe("Pokémon 'missingno' não encontrado.");
  });

  it('erro sem corpo conhecido vira INTERNAL_ERROR com mensagem genérica', async () => {
    const fetchFn = fetchReturning(502, 'gateway');

    const error = await apiGet('/pokemon', schema, { fetchFn }).catch((caught: unknown) => caught);

    expect(error).toMatchObject({ code: 'INTERNAL_ERROR', status: 502 });
    expect(isRetryableError(error)).toBe(true);
  });

  it('resposta 200 fora do contrato lança ApiContractError', async () => {
    const fetchFn = fetchReturning(200, { nome: 'pikachu' });

    await expect(apiGet('/pokemon/pikachu', schema, { fetchFn })).rejects.toBeInstanceOf(
      ApiContractError,
    );
  });

  it('falha de rede recebe mensagem segura e é considerada repetível', () => {
    const error = new TypeError('Failed to fetch');

    expect(describeError(error)).toMatch(/conexão/);
    expect(isRetryableError(error)).toBe(true);
    expect(isRetryableError(new ApiClientError('VALIDATION_ERROR', 'x', 400))).toBe(false);
  });
});
