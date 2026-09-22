import { z } from 'zod';

export const API_ERROR_CODES = [
  'VALIDATION_ERROR',
  'POKEMON_NOT_FOUND',
  'UPSTREAM_UNAVAILABLE',
  'INTERNAL_ERROR',
] as const;

export const apiErrorCodeSchema = z.enum(API_ERROR_CODES);
export type ApiErrorCode = z.infer<typeof apiErrorCodeSchema>;

/**
 * Formato único de erro em todas as rotas (§6.3).
 * CUIDADO: `message` é exibida ao usuário. Nunca carrega stack trace, URL interna nem corpo do upstream.
 */
export const apiErrorSchema = z.object({
  error: z.object({
    code: apiErrorCodeSchema,
    message: z.string().min(1),
  }),
});
export type ApiError = z.infer<typeof apiErrorSchema>;

/** Status HTTP de cada código, para o error handler (A4) e o cliente (A5) concordarem. */
export const HTTP_STATUS_BY_ERROR_CODE: Readonly<Record<ApiErrorCode, 400 | 404 | 500 | 502>> = {
  VALIDATION_ERROR: 400,
  POKEMON_NOT_FOUND: 404,
  UPSTREAM_UNAVAILABLE: 502,
  INTERNAL_ERROR: 500,
};
