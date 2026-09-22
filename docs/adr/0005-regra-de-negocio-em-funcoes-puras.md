# ADR-005 — Regra de negócio vive em `packages/domain`, em funções puras

**Status:** aceito · **Data:** 2026-09-22

## Contexto

As três regras do projeto — cálculo de fraquezas, achatamento da cadeia evolutiva e sanitização
de texto — têm risco real de erro silencioso (somar em vez de multiplicar acerta Charizard e erra
Sableye) e precisam de testes rápidos e determinísticos.

## Alternativa descartada

**Colocá-las no controller Fastify** (ou no React). Impede teste sem subir servidor, mistura HTTP
com regra e tenta a UI a recalcular o que o servidor já sabe.

## Decisão

Funções puras em `packages/domain`, sem `fastify`, `react`, `node:http` nem `fetch`. O mapper do
BFF **chama** essas funções; a UI **recebe pronto** (`weaknesses`, `evolution`, metros e quilos).
Testes rodam offline com gabarito conferido contra a API real.

## Consequências

- Duplicar a regra fora de `packages/domain` reprova a entrega (§10.4 do `AGENTS.md`).
- Nenhuma função utilitária lança por entrada inválida: `sanitizeFlavorText(null)` devolve `null`.
- O domínio depende só de `packages/contracts` (tipos), nunca de `apps/*`.
