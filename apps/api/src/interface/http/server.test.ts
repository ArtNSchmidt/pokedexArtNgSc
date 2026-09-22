import {
  apiErrorSchema,
  healthSchema,
  pokemonDetailSchema,
  pokemonListPageSchema,
} from '@pokedex/contracts';
import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createUseCases } from '../../application/useCases/index.js';
import { FakePokemonRepository, INDEX_SIZE } from './__fixtures__/fakePokemonRepository.js';
import { buildServer } from './server.js';

describe('API HTTP (§6)', () => {
  let app: FastifyInstance;
  let repository: FakePokemonRepository;

  beforeAll(async () => {
    repository = new FakePokemonRepository();
    app = buildServer({ useCases: createUseCases(repository), logger: false });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health devolve status e tamanho do índice', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/v1/health' });

    expect(response.statusCode).toBe(200);
    expect(healthSchema.parse(response.json())).toEqual({ status: 'ok', indexSize: INDEX_SIZE });
  });

  it('GET /pokemon aplica defaults, valida a query e envia Cache-Control', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/pokemon?type=grass&pageSize=3',
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers['cache-control']).toBe('public, max-age=300');
    expect(response.headers['content-type']).toMatch(/application\/json/);
    expect(pokemonListPageSchema.safeParse(response.json()).success).toBe(true);
    expect(repository.receivedQueries.at(-1)).toEqual({
      page: 1,
      pageSize: 3,
      q: undefined,
      type: 'grass',
      generation: undefined,
    });
  });

  it.each([
    ['tipo inexistente', '/api/v1/pokemon?type=banana', 'type'],
    ['page não numérica', '/api/v1/pokemon?page=abc', 'page'],
    ['pageSize fora da faixa', '/api/v1/pokemon?pageSize=61', 'pageSize'],
  ])('GET /pokemon com %s → 400 VALIDATION_ERROR', async (_label, url, field) => {
    const response = await app.inject({ method: 'GET', url });
    const body = apiErrorSchema.parse(response.json());

    expect(response.statusCode).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.message).toContain(field);
  });

  it('GET /pokemon/:idOrName devolve o detalhe do contrato (Charizard, §6.4)', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/v1/pokemon/charizard' });
    const detail = pokemonDetailSchema.parse(response.json());

    expect(response.statusCode).toBe(200);
    expect(detail.weaknesses[0]).toEqual({ type: 'rock', multiplier: 4 });
  });

  it('Pokémon inexistente → 404 POKEMON_NOT_FOUND com mensagem legível', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/v1/pokemon/missingno' });

    expect(response.statusCode).toBe(404);
    expect(apiErrorSchema.parse(response.json())).toEqual({
      error: { code: 'POKEMON_NOT_FOUND', message: "Pokémon 'missingno' não encontrado." },
    });
  });

  it('upstream fora → 502 UPSTREAM_UNAVAILABLE sem vazar detalhes', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/v1/pokemon/upstream-down' });
    const body = apiErrorSchema.parse(response.json());

    expect(response.statusCode).toBe(502);
    expect(body.error.code).toBe('UPSTREAM_UNAVAILABLE');
    expect(body.error.message).not.toMatch(/503|pokeapi|HTTP/);
  });

  it('erro inesperado → 500 INTERNAL_ERROR com mensagem genérica', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/v1/pokemon/boom' });
    const body = apiErrorSchema.parse(response.json());

    expect(response.statusCode).toBe(500);
    expect(body.error.code).toBe('INTERNAL_ERROR');
    expect(body.error.message).not.toContain('senha');
  });

  it('rota inexistente → 404 ROUTE_NOT_FOUND', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/v1/nope' });

    expect(response.statusCode).toBe(404);
    expect(apiErrorSchema.parse(response.json()).error.code).toBe('ROUTE_NOT_FOUND');
  });

  it('GET /types e /generations devolvem 18 e 9 opções', async () => {
    const types = await app.inject({ method: 'GET', url: '/api/v1/types' });
    const generations = await app.inject({ method: 'GET', url: '/api/v1/generations' });

    expect(types.json()).toHaveLength(18);
    expect(generations.json()).toHaveLength(9);
  });

  it('responde CORS para qualquer origem, só GET', async () => {
    const response = await app.inject({
      method: 'OPTIONS',
      url: '/api/v1/pokemon',
      headers: { origin: 'http://localhost:5173', 'access-control-request-method': 'GET' },
    });

    expect(response.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    expect(response.headers['access-control-allow-methods']).toBe('GET');
  });
});
