import cors from '@fastify/cors';
import Fastify, { type FastifyInstance } from 'fastify';
import type { UseCases } from '../../application/useCases/index.js';
import { errorHandler, notFoundHandler } from './errorHandler.js';
import { catalogRoutes } from './routes/catalog.routes.js';
import { healthRoutes } from './routes/health.routes.js';
import { pokemonRoutes } from './routes/pokemon.routes.js';

export const API_PREFIX = '/api/v1';

/** BFF de dados que mudam raramente: 5 min de cache no cliente/proxy (§7.6). */
const READ_CACHE_CONTROL = 'public, max-age=300';
const HEALTH_PATH = `${API_PREFIX}/health`;
const HTTP_OK = 200;

export interface ServerOptions {
  readonly useCases: UseCases;
  /** `false` nos testes; em produção o logger do Fastify é o único canal de log (§5.5). */
  readonly logger?: boolean;
}

/** Cria a instância Fastify com CORS, error handler e rotas. Não escuta: isso é do `main.ts`. */
export function buildServer({ useCases, logger = true }: ServerOptions): FastifyInstance {
  const app = Fastify({ logger });

  void app.register(cors, { origin: true, methods: ['GET'] });
  app.setErrorHandler(errorHandler);
  app.setNotFoundHandler(notFoundHandler);
  app.addHook('onSend', (request, reply, payload, done) => {
    if (request.method === 'GET' && reply.statusCode === HTTP_OK && request.url !== HEALTH_PATH) {
      void reply.header('cache-control', READ_CACHE_CONTROL);
    }
    done(null, payload);
  });

  void app.register(
    async (api) => {
      await api.register(healthRoutes, { getHealth: useCases.getHealth });
      await api.register(catalogRoutes, {
        listTypes: useCases.listTypes,
        listGenerations: useCases.listGenerations,
      });
      await api.register(pokemonRoutes, {
        listPokemon: useCases.listPokemon,
        getPokemonDetail: useCases.getPokemonDetail,
      });
    },
    { prefix: API_PREFIX },
  );

  return app;
}
