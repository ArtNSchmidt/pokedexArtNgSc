import { z } from 'zod';

/** `GET /health`: `indexSize` é o tamanho do índice da Pokédex nacional carregado no bootstrap (ADR-003). */
export const healthSchema = z.object({
  status: z.literal('ok'),
  indexSize: z.number().int().min(0),
});
export type Health = z.infer<typeof healthSchema>;
