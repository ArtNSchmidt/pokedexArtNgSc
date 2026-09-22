import type { ZodType } from 'zod';

/** Entrada da requisição fora do contrato (§6.1). Traduzida para `400 VALIDATION_ERROR` pelo handler. */
export class RequestValidationError extends Error {
  readonly invalidFields: readonly string[];

  constructor(invalidFields: readonly string[]) {
    super(`Parâmetros inválidos: ${invalidFields.join(', ')}.`);
    this.name = 'RequestValidationError';
    this.invalidFields = invalidFields;
  }
}

const UNNAMED_FIELD = 'valor';

/** Valida na borda (§5.3): query string e parâmetros de rota passam por aqui antes do caso de uso. */
export function parseOrThrow<T>(schema: ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (result.success) return result.data;

  const fields = [
    ...new Set(
      result.error.issues.map((issue) => issue.path.map(String).join('.') || UNNAMED_FIELD),
    ),
  ];
  throw new RequestValidationError(fields);
}
