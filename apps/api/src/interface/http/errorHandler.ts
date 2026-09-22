import { HTTP_STATUS_BY_ERROR_CODE, type ApiError, type ApiErrorCode } from '@pokedex/contracts';
import { PokemonNotFoundError, UpstreamUnavailableError } from '@pokedex/domain';
import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { RequestValidationError } from './validation.js';

/**
 * Único ponto que traduz exceção → HTTP (§5.3, §6.3). Rota nenhuma monta corpo de erro.
 * CUIDADO: a mensagem vai para o usuário. Só `PokemonNotFoundError` e `RequestValidationError`
 * têm mensagens próprias seguras; o resto recebe texto genérico e o detalhe fica no log.
 */
const UPSTREAM_MESSAGE =
  'A fonte de dados está indisponível no momento. Tente de novo em instantes.';
const INTERNAL_MESSAGE = 'Ocorreu um erro inesperado. Tente de novo.';
const ROUTE_MESSAGE = 'Rota não encontrada.';
const BAD_REQUEST_MESSAGE = 'Requisição inválida.';
const HTTP_CLIENT_ERROR_MIN = 400;
const HTTP_SERVER_ERROR_MIN = 500;

interface Translated {
  readonly code: ApiErrorCode;
  readonly message: string;
}

export function translateError(error: unknown): Translated {
  if (error instanceof RequestValidationError) {
    return { code: 'VALIDATION_ERROR', message: error.message };
  }
  if (error instanceof PokemonNotFoundError) {
    return { code: 'POKEMON_NOT_FOUND', message: error.message };
  }
  if (error instanceof UpstreamUnavailableError) {
    return { code: 'UPSTREAM_UNAVAILABLE', message: UPSTREAM_MESSAGE };
  }
  if (isFastifyClientError(error)) {
    return { code: 'VALIDATION_ERROR', message: BAD_REQUEST_MESSAGE };
  }
  return { code: 'INTERNAL_ERROR', message: INTERNAL_MESSAGE };
}

/** Erros que o próprio Fastify gera antes do handler (URL malformada, corpo inválido…). */
function isFastifyClientError(error: unknown): error is FastifyError {
  if (typeof error !== 'object' || error === null || !('statusCode' in error)) return false;
  const { statusCode } = error;
  return (
    typeof statusCode === 'number' &&
    statusCode >= HTTP_CLIENT_ERROR_MIN &&
    statusCode < HTTP_SERVER_ERROR_MIN
  );
}

function toBody(translated: Translated): ApiError {
  return { error: { code: translated.code, message: translated.message } };
}

export function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply,
): void {
  const translated = translateError(error);
  const status = HTTP_STATUS_BY_ERROR_CODE[translated.code];

  if (status >= HTTP_SERVER_ERROR_MIN) {
    request.log.error({ err: error, code: translated.code }, 'falha ao atender a requisição');
  } else {
    request.log.info({ code: translated.code, message: error.message }, 'requisição rejeitada');
  }

  void reply.status(status).send(toBody(translated));
}

export function notFoundHandler(_request: FastifyRequest, reply: FastifyReply): void {
  void reply
    .status(HTTP_STATUS_BY_ERROR_CODE.ROUTE_NOT_FOUND)
    .send(toBody({ code: 'ROUTE_NOT_FOUND', message: ROUTE_MESSAGE }));
}
