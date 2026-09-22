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

## Desvio registrado em relação ao §6 do `AGENTS.md`

`PokemonSummary` ganha `artworkUrl: string | null` (antes só em `PokemonDetail`, que continua a
tê-lo por herança). Motivo: a referência visual (Figma "Pokédex (Community)") usa a _official
artwork_ nos cards da lista, não o sprite pixelado de 96 px. `spriteUrl` permanece como fallback.
O custo é zero: o BFF já busca `/pokemon/{id}` para obter os tipos de cada card.

## Consequências

- `packages/contracts` não importa ninguém; todos importam dele (ADR-006).
- Nenhum schema aqui conhece o formato da PokéAPI: isso é `apps/api/src/infrastructure`.
- Depois de publicado, o contrato só muda por pedido registrado em `docs/handoff/requests.md`.
