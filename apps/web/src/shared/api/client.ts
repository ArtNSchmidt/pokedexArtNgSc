import { apiErrorSchema, type ApiErrorCode } from '@pokedex/contracts';
import type { ZodType } from 'zod';

/**
 * Prefixo do BFF. O caminho é sempre relativo: em desenvolvimento o proxy do Vite e em produção os
 * rewrites de `apps/web/vercel.json` encaminham `/api` ao Fastify. O browser nunca fala com outra
 * origem, então não há preflight de CORS nem URL de backend embutida no bundle (ADR-008).
 */
export const API_BASE_PATH = '/api/v1';

/** Erro devolvido pelo BFF no formato de §6.3. `message` vem do servidor e é segura para exibir. */
export class ApiClientError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;

  constructor(code: ApiErrorCode, message: string, status: number) {
    super(message);
    this.name = 'ApiClientError';
    this.code = code;
    this.status = status;
  }
}

/** Resposta 2xx que não casa com o contrato: bug de integração, nunca `any` silencioso (§7.7). */
export class ApiContractError extends Error {
  constructor(path: string) {
    super(`Resposta de ${path} fora do contrato`);
    this.name = 'ApiContractError';
  }
}

/** Porta estreita de `fetch`: só o que o cliente usa, para os testes injetarem um substituto sem cast. */
export type FetchLike = (
  input: string,
  init?: RequestInit,
) => Promise<Pick<Response, 'ok' | 'status' | 'json'>>;

export interface ApiGetOptions {
  readonly signal?: AbortSignal | undefined;
  readonly fetchFn?: FetchLike;
}

const DEFAULT_ERROR_MESSAGE = 'O servidor respondeu de forma inesperada.';

/** `GET` no BFF validado pelo schema do contrato: devolve o tipo ou lança um erro tipado. */
export async function apiGet<T>(
  path: string,
  schema: ZodType<T>,
  options: ApiGetOptions = {},
): Promise<T> {
  const fetchFn: FetchLike = options.fetchFn ?? fetch;
  const init: RequestInit = { headers: { accept: 'application/json' } };
  if (options.signal !== undefined) init.signal = options.signal;

  const response = await fetchFn(`${API_BASE_PATH}${path}`, init);
  const body = await readJsonBody(response);
  if (!response.ok) throw toClientError(response.status, body);

  const parsed = schema.safeParse(body);
  if (!parsed.success) throw new ApiContractError(path);
  return parsed.data;
}

async function readJsonBody(response: Pick<Response, 'json'>): Promise<unknown> {
  try {
    const body: unknown = await response.json();
    return body;
  } catch {
    return undefined;
  }
}

function toClientError(status: number, body: unknown): ApiClientError {
  const parsed = apiErrorSchema.safeParse(body);
  if (parsed.success) {
    return new ApiClientError(parsed.data.error.code, parsed.data.error.message, status);
  }
  return new ApiClientError('INTERNAL_ERROR', DEFAULT_ERROR_MESSAGE, status);
}

/** Texto seguro para o `ErrorState`, qualquer que seja a falha. */
export function describeError(error: unknown): string {
  if (error instanceof ApiClientError) return error.message;
  if (error instanceof ApiContractError) return 'O servidor respondeu em um formato inesperado.';
  return 'Não foi possível falar com o servidor. Verifique sua conexão e tente de novo.';
}

export function isNotFoundError(error: unknown): boolean {
  return error instanceof ApiClientError && error.code === 'POKEMON_NOT_FOUND';
}

/** Falhas do cliente (4xx) não se resolvem repetindo; só as do servidor merecem nova tentativa. */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof ApiClientError) return error.status >= 500;
  return !(error instanceof ApiContractError);
}
