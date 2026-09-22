# Revisão final — rodada adversarial (2026-09-22)

Depois da onda 4, o repositório passou por uma revisão com **seis revisores independentes** (rigor
TypeScript e Clean Code, arquitetura e fronteiras, conformidade com o contrato, corretude de
domínio e adapter, UI/UX e acessibilidade, testes e documentação) e uma fase de **céticos** que
tentavam refutar cada achado. Foram 59 achados brutos; a fase de refutação ficou incompleta por
limite de sessão, então os achados sem dois votos foram triados manualmente, um a um, contra o
código.

Este documento é o registro do que mudou depois disso. Os números de teste citados nos handoffs
A0–A6 são o estado no fim de cada onda; os totais atuais estão na seção de verificação abaixo.

## Bugs corrigidos

| #   | Sintoma                                                        | Causa                                                                                               | Correção                                                                                                               |
| --- | -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| 1   | Buscar `Farfetch'd` ou `Sirfetch'd` não achava nada            | `normalizeForSearch` hifenizava o apóstrofo (`farfetch-d`), mas o slug da API o apaga (`farfetchd`) | apóstrofos são removidos antes de hifenizar o resto (`packages/domain/src/text.ts`)                                    |
| 2   | Digitar só espaços na busca derrubava a lista em tela de erro  | `?q=%20%20` chegava ao BFF e reprovava em `min(1)` → `400`                                          | parâmetro em branco conta como ausente em todos os campos (`listQuerySchema`), e a UI apara o termo antes de consultar |
| 3   | `?page=` ou `?pageSize=` vazios respondiam `400`               | só `q`, `type` e `generation` tratavam vazio como ausente                                           | mesmo `blankAsUndefined` aplicado aos cinco campos                                                                     |
| 4   | URL digitada à mão com `q` acima de 40 caracteres virava `400` | a UI repassava o valor cru da URL                                                                   | `readFilters` limita ao máximo do contrato                                                                             |
| 5   | `paginate` com `NaN` devolvia `page: null` no JSON             | `Math.max(1, Math.floor(NaN))` é `NaN`                                                              | satura em 1; a função voltou a ser total (§5.3)                                                                        |
| 6   | Página além do total mostrava grade vazia e "Página 99 de 43"  | só `total === 0` tinha estado vazio                                                                 | estado próprio explicando o total e com botão para a primeira página                                                   |

## Acessibilidade e mobile-first

| #   | Problema medido                                                                                                                   | Correção                                                                                                                            |
| --- | --------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| 7   | A verificação "sem rolagem horizontal" era **vacuosa**: `overflow-x: hidden` no `body` força `scrollWidth === clientWidth` sempre | regra removida; a checagem agora mede o elemento mais largo da página e vale como prova                                             |
| 8   | Chips `water` e `psychic` com texto branco ficavam em 3,0:1 e 3,1:1 (mínimo 4,5:1)                                                | passaram a usar tinta escura: 5,3:1 e 5,2:1                                                                                         |
| 9   | Títulos de seção e rótulos de stat usavam a cor viva do tipo sobre o card branco — `electric` em 1,5:1                            | novos tokens `--type-<x>-deep`, cada um ≥ 4,5:1 sobre branco; o fundo dos chips e o preenchimento das barras seguem vivos (ADR-007) |
| 10  | Campo de busca tinha 32 px de alvo de toque, abaixo dos 44 px de §7.7                                                             | mantém os 32 px de desenho e recebe toque em 44 px                                                                                  |
| 11  | `Escape` no painel de filtros deixava o foco no `body`                                                                            | o foco volta para o botão que abriu o painel                                                                                        |

## Clean Code

| #   | Achado                                                                                                                                     | Correção                                                                                    |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| 12  | `formatGeneration` reconstruía por regex o rótulo que `GENERATION_OPTIONS` já publica — segundo dicionário para o mesmo conceito (ADR-004) | passou a ler o contrato, com assinatura `GenerationName`                                    |
| 13  | `describeEvolutionStep` tinha dois `?? UNKNOWN_CONDITION` inalcançáveis, forçados por um `Record<string, string>` frouxo demais            | as duas mensagens viraram constantes nomeadas; o dicionário ficou só para o lookup genérico |
| 14  | `updateFilters` recebia um booleano que trocava o comportamento (push × replace no histórico), proibido por §5.5                           | virou `pushFilters` e `replaceFilters`, cada um com a intenção no nome                      |
| 15  | `IconLink` não tinha nenhum consumidor e o link "voltar" se repetia três vezes na tela de detalhe                                          | `IconLink` removido (código morto); o link virou um `BackLink` usado nos três lugares       |
| 16  | `paths` morava em `app/router.tsx`, que importa as telas que importam `paths` — ciclo de módulos                                           | `paths` passou para `shared/routes.ts`                                                      |

## Lacunas de teste fechadas

`PokeApiClient` não tinha teste nenhum, apesar de ser a fronteira que traduz HTTP em erro de
domínio. Foram acrescentados 11 testes: cliente (URL montada, `AbortSignal` de timeout, 404 →
`PokemonNotFoundError`, 5xx/rede/JSON inválido → `UpstreamUnavailableError`, causa preservada),
`fetchParsed` (schema válido, schema inválido com caminho e campo, sem vazar o corpo do upstream),
índice (falha não fica cacheada) e lista (busca em branco, `q` longo, página além do total, troca
de tipo voltando para a página 1).

Dois nomes de teste que mentiam foram corrigidos: um prometia verificar paralelismo e verificava
cache; outro dizia filtrar "1.025 de 1.351" sobre uma fixture que já vinha com 1.025 entradas.

## O que foi examinado e deliberadamente não mudou

- **`humanizeSlug` duplicar `toDisplayName`**: a duplicação é imposta pelo ADR-006 — `apps/web`
  não pode importar `packages/domain`. Mover a função para `packages/contracts` a tornaria uma
  regra de apresentação num pacote de tipos.
- **Mapper preencher stat ausente com 0 e tipo ausente com relações neutras**: é defesa contra um
  upstream incompleto, não invenção de dado; o caminho é inalcançável com os 18 tipos carregados.
- **`pokemon.types[0] ?? 'normal'`**: o contrato garante 1 ou 2 tipos, mas o TypeScript não; o
  fallback evita uma tela branca por um dado impossível.
- **Cadeia evolutiva buscada depois da espécie**: é dependência real (`species.evolution_chain`),
  não sequencialidade acidental.
- **Cache com chave por identificador** (`pokemon:6` e `pokemon:charizard`): duplica uma entrada
  por Pokémon visitado pelos dois caminhos, sem risco de resposta errada. Trocar por id exigiria
  uma ida à rede só para descobrir o id.

## Verificação (comandos e saída literal)

```
$ pnpm typecheck && pnpm lint && pnpm test:run && pnpm build
packages/contracts typecheck: Done · packages/domain typecheck: Done
apps/web typecheck: Done · apps/api typecheck: Done
All matched files use Prettier code style!
packages/contracts  Tests  20 passed (20)
packages/domain     Tests  71 passed (71)
apps/web            Tests  31 passed (31)
apps/api            Tests  65 passed | 3 skipped (68)
apps/web build: ✓ built in 1.35s · apps/api build: Done

$ curl -s localhost:3333/api/v1/pokemon/charizard   → weaknesses == §6.4  (true)
$ curl -s ".../pokemon?generation=generation-i"     → total 151
$ curl -s .../types                                 → 18
$ curl -s .../generations                           → 9
$ curl -s ".../pokemon?q=Farfetch%27d"              → total 1  farfetchd     (antes: 0)
$ curl -s ".../pokemon?q=%20%20%20"                 → 200, total 1025       (antes: 400)
$ curl -s ".../pokemon?page="                       → 200, page 1           (antes: 400)
$ curl -s ".../pokemon?type=banana"                 → 400
$ curl -s .../pokemon/missingno                     → 404
$ curl -s .../nope                                  → 404 ROUTE_NOT_FOUND
```

Prints em 360 × 800 refeitos em `docs/handoff/prints/`. A checagem de rolagem horizontal agora
mede o elemento mais largo de cada página, com `overflow-x: visible` no `body`: as nove telas
ficam em 360 px exatos.
