import { UpstreamUnavailableError } from '@pokedex/domain';
import type { ZodType } from 'zod';
import type { JsonHttpClient } from '../http/pokeApiClient.js';

/**
 * Busca e valida na borda (§5.3): resposta que não casa com o schema do terceiro é tratada como
 * upstream indisponível, com o caminho e a primeira divergência no log — nunca no cliente.
 */
export async function fetchParsed<T>(
  client: JsonHttpClient,
  path: string,
  schema: ZodType<T>,
): Promise<T> {
  const body = await client.getJson(path);
  const result = schema.safeParse(body);
  if (!result.success) {
    throw new UpstreamUnavailableError(
      `resposta inesperada em ${path}${describeFirstIssue(result.error.issues)}`,
    );
  }
  return result.data;
}

function describeFirstIssue(issues: readonly { path: PropertyKey[]; message: string }[]): string {
  const issue = issues[0];
  if (issue === undefined) return '';
  return ` (${issue.path.map(String).join('.')}: ${issue.message})`;
}
