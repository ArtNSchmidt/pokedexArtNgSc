# ADR-004 — `packages/contracts` é a única fonte de verdade de tipos

**Status:** aceito · **Data:** 2026-09-22

## Contexto

Backend e frontend precisam concordar sobre o formato de `PokemonListPage`, `PokemonDetail`,
erros e query strings. Interfaces duplicadas divergem em uma semana.

## Alternativa descartada

**Duplicar interfaces em cada app.** Simples no dia 1; no dia 8 o backend renomeia um campo e a UI
compila feliz mostrando `undefined`.

## Decisão

Um único pacote com **schemas Zod**. O tipo TypeScript é derivado com `z.infer`, nunca redigitado.
O BFF valida a query com o mesmo schema que o React usa para validar a resposta. Um `curl` que
quebre o contrato quebra o type-check dos dois lados na mesma hora.

## Desvios registrados em relação ao §6 do `AGENTS.md`

Três adições, todas compatíveis (nada foi removido ou renomeado):

1. **`artworkUrl: string | null` em `PokemonSummary`** (antes só em `PokemonDetail`, que continua a
   tê-lo por herança). Motivo: a referência visual (Figma "Pokédex (Community)") usa a _official
   artwork_ nos cards da lista, não o sprite pixelado de 96 px. `spriteUrl` permanece como
   fallback. O custo é zero: o BFF já busca `/pokemon/{id}` para obter os tipos de cada card.
2. **`evolutionStages: EvolutionStage[]` em `PokemonDetail`**, ao lado de `evolution`. Um
   `EvolutionStep` só tem slugs; para desenhar a cadeia com sprite e nome, a UI teria de chamar
   `/pokemon/:name` por estágio (nove vezes para Eevee) ou formatar nomes por conta própria,
   duplicando `toDisplayName` fora do domínio. O BFF já resolve esses Pokémon e os entrega prontos.
3. **`ROUTE_NOT_FOUND` (HTTP 404) em `API_ERROR_CODES`**, pedido pelo A4 em
   `docs/handoff/requests.md`: §6.3 cobria Pokémon inexistente, mas não rota inexistente, e
   responder `POKEMON_NOT_FOUND` para `/api/v1/nope` seria mentira.

Uma quarta mudança, de comportamento e não de forma, também está em `requests.md`: parâmetro de
query em branco (vazio ou só com espaços) conta como não informado em **todos** os campos.

## Consequências

- `packages/contracts` não importa ninguém; todos importam dele (ADR-006).
- Nenhum schema aqui conhece o formato da PokéAPI: isso é `apps/api/src/infrastructure`.
- Depois de publicado, o contrato só muda por pedido registrado em `docs/handoff/requests.md`.
