# ADR-003 — Busca e filtros resolvidos sobre um índice carregado no bootstrap

**Status:** aceito · **Data:** 2026-09-22

## Contexto

A PokéAPI **não tem busca por substring** (não existe `?q=` nem `?search=`). O índice completo
`/pokemon?limit=100000` tem 1.351 entradas, 93 KB, e responde em ~0,3 s. Só os ids `1…1025` são a
Pokédex nacional; as 326 entradas com `id ≥ 10001` são formas alternativas.

## Alternativa descartada

**Buscar sob demanda no upstream a cada tecla.** Impossível: a API não oferece a operação. Uma
variação, listar tudo no cliente, devolveria ao navegador o problema que o ADR-001 resolveu.

## Decisão

O BFF carrega `/pokemon?limit=1025&offset=0` **uma vez** no bootstrap e mantém em memória um índice
`{ id, name, normalizedName }`. Busca (normalizada, sem acento nem caixa, "começa com" antes de
"contém"), filtros por tipo e geração (conjuntos de ids vindos de `/type/{name}` e
`/generation/{name}`, com interseção) e paginação são operações locais, em microssegundos.

## Consequências

- A primeira requisição do processo espera o índice (≈0,3 s); depois, busca é instantânea.
- Os cards de uma página ainda exigem `GET /pokemon/{id}` para tipos e sprites, mas cacheados
  (ADR-002) e deduplicados.
- O filtro `id ≤ 1025` é aplicado em **toda** listagem vinda do upstream, senão o total diverge do
  gabarito (151 na geração I).
