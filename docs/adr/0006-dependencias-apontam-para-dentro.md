# ADR-006 — Dependências apontam para dentro

**Status:** aceito · **Data:** 2026-09-22

## Contexto

Quatro workspaces, sete agentes. Sem uma regra de direção, `packages/domain` acaba importando o
cliente HTTP "só desta vez" e o React acaba conhecendo `pokeapi.co`.

## Alternativa descartada

**Confiar na disciplina.** Não escala nem para uma pessoa; um `grep` custa menos que um code
review.

## Decisão

```
apps/web ──┐
           ├──► packages/contracts ◄── apps/api ──► packages/domain ──► packages/contracts
apps/api ──┘
```

- `packages/contracts` não importa ninguém.
- `packages/domain` importa apenas `packages/contracts`; nunca `apps/*`, `fastify`, `react`.
- `apps/api` importa `contracts` e `domain`; a URL `pokeapi.co` só existe em
  `apps/api/src/infrastructure/`.
- `apps/web` importa apenas `contracts` e fala apenas com `/api`.

## Consequências

- Uma seta ao contrário é falha de revisão, não questão de gosto.
- A verificação é mecânica (§10.3 do `AGENTS.md`): três `grep` que devem sair vazios.
- O SDK/HTTP de terceiro fica atrás de uma abstração própria (porta `PokemonRepository`).
