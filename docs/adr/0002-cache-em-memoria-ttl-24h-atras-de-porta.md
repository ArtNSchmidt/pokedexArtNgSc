# ADR-002 — Cache em memória com TTL de 24 h, atrás de uma porta

**Status:** aceito · **Data:** 2026-09-22

## Contexto

A fair use policy da PokéAPI exige cache local (_"Locally cache resources whenever you request
them"_) e ameaça banimento de IP. O upstream responde `cache-control: max-age=86400`.

## Alternativa descartada

**Redis.** Correto em produção (compartilhado entre instâncias, sobrevive a restart), mas adiciona
Docker e uma dependência que o avaliador teria de subir só para rodar o trabalho.

## Decisão

`Cache` é uma **interface do domínio** (`packages/domain/src/ports.ts`). A implementação
`InMemoryTtlCache` (`apps/api/src/infrastructure/cache`) é infraestrutura: TTL padrão de 86.400 s
espelhando o upstream, limite de entradas com descarte do mais antigo e deduplicação de
requisições em voo (duas chamadas concorrentes à mesma chave compartilham uma promessa).

## Consequências

- O cache não é otimização: é **requisito de conformidade** com a política da API.
- Trocar para Redis é trocar a implementação da porta, sem tocar em caso de uso ou rota.
- O cache morre com o processo; o índice (ADR-003) é reaquecido no bootstrap.
