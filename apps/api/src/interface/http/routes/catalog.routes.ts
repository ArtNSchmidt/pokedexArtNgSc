import type { FastifyPluginAsync } from 'fastify';
import type { ListGenerations, ListTypes } from '../../../application/useCases/index.js';

export interface CatalogRoutesOptions {
  readonly listTypes: ListTypes;
  readonly listGenerations: ListGenerations;
}

export const catalogRoutes: FastifyPluginAsync<CatalogRoutesOptions> = (
  app,
  { listTypes, listGenerations },
) => {
  app.get('/types', () => listTypes());
  app.get('/generations', () => listGenerations());
  return Promise.resolve();
};
