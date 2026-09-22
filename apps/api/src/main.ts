/**
 * Composition root (Clean Code, cap. 11): o único lugar que sabe montar o sistema. Instancia
 * cache, cliente, repositório, casos de uso e servidor; aquece o índice; escuta; trata SIGTERM.
 */
import { createUseCases } from './application/useCases/index.js';
import {
  createRepositoryCaches,
  PokeApiClient,
  PokeApiPokemonRepository,
  PokemonIndex,
} from './infrastructure/index.js';
import { buildServer } from './interface/http/server.js';

const DEFAULT_PORT = 3333;
const DEFAULT_HOST = '0.0.0.0';
const EXIT_FAILURE = 1;

function readPort(): number {
  const raw = process.env.PORT;
  const parsed = raw === undefined ? Number.NaN : Number(raw);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : DEFAULT_PORT;
}

async function main(): Promise<void> {
  const client = new PokeApiClient();
  const index = new PokemonIndex(client);
  const repository = new PokeApiPokemonRepository({
    client,
    index,
    caches: createRepositoryCaches(),
  });
  const app = buildServer({ useCases: createUseCases(repository) });

  // Aquecimento (ADR-003). Se a PokéAPI estiver fora agora, a primeira requisição tenta de novo.
  try {
    await index.ensureLoaded();
    app.log.info({ indexSize: index.size() }, 'índice da Pokédex carregado');
  } catch (error) {
    app.log.warn({ err: error }, 'índice não carregou no bootstrap; será carregado sob demanda');
  }

  const stop = (signal: NodeJS.Signals): void => {
    app.log.info({ signal }, 'encerrando');
    void app.close().finally(() => {
      process.exit(0);
    });
  };
  process.once('SIGTERM', stop);
  process.once('SIGINT', stop);

  await app.listen({ port: readPort(), host: process.env.HOST ?? DEFAULT_HOST });
}

main().catch((error: unknown) => {
  process.stderr.write(`falha fatal ao iniciar a API: ${String(error)}\n`);
  process.exit(EXIT_FAILURE);
});
