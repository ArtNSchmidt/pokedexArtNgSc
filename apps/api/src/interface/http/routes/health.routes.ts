import type { FastifyPluginAsync } from 'fastify';
import type { GetHealth } from '../../../application/useCases/index.js';

export interface HealthRoutesOptions {
  readonly getHealth: GetHealth;
}

export const healthRoutes: FastifyPluginAsync<HealthRoutesOptions> = (app, { getHealth }) => {
  app.get('/health', () => getHealth());
  return Promise.resolve();
};
