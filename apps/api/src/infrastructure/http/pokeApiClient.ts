import { PokemonNotFoundError, UpstreamUnavailableError } from '@pokedex/domain';

/** Abstração de transporte: o repositório depende dela, não de `fetch` (§5.2, ADR-006). */
export interface JsonHttpClient {
  getJson(path: string): Promise<unknown>;
}

/** Único lugar do repositório que conhece o host da PokéAPI (§5.2). */
export const POKEAPI_BASE_URL = 'https://pokeapi.co/api/v2';

const REQUEST_TIMEOUT_MS = 8_000;
const HTTP_NOT_FOUND = 404;

export type FetchFunction = typeof fetch;

/**
 * Cliente HTTP da PokéAPI. Traduz o mundo HTTP para os erros do domínio: 404 vira
 * `PokemonNotFoundError`; timeout, falha de rede, 5xx e corpo inválido viram
 * `UpstreamUnavailableError`. Quem chama nunca vê `Response`.
 */
export class PokeApiClient implements JsonHttpClient {
  private readonly baseUrl: string;
  private readonly fetchFn: FetchFunction;

  constructor(options: { baseUrl?: string; fetchFn?: FetchFunction } = {}) {
    this.baseUrl = options.baseUrl ?? POKEAPI_BASE_URL;
    this.fetchFn = options.fetchFn ?? fetch;
  }

  async getJson(path: string): Promise<unknown> {
    const response = await this.send(path);

    if (response.status === HTTP_NOT_FOUND) {
      throw new PokemonNotFoundError(lastSegment(path));
    }
    if (!response.ok) {
      throw new UpstreamUnavailableError(`HTTP ${String(response.status)} em ${path}`);
    }
    return this.readJson(response, path);
  }

  private async send(path: string): Promise<Response> {
    try {
      return await this.fetchFn(`${this.baseUrl}${path}`, {
        headers: { accept: 'application/json' },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (cause) {
      throw new UpstreamUnavailableError(`falha de rede ou timeout em ${path}`, { cause });
    }
  }

  private async readJson(response: Response, path: string): Promise<unknown> {
    try {
      const body: unknown = await response.json();
      return body;
    } catch (cause) {
      throw new UpstreamUnavailableError(`corpo não é JSON em ${path}`, { cause });
    }
  }
}

/** `/pokemon/missingno` → `missingno`; é o identificador que o usuário digitou. */
function lastSegment(path: string): string {
  const withoutQuery = path.split('?')[0] ?? path;
  return (
    withoutQuery
      .split('/')
      .filter((segment) => segment.length > 0)
      .at(-1) ?? path
  );
}
