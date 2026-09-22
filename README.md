# Pokédex

Pokédex consultável no celular, feita como trabalho universitário. Um **BFF** em Fastify agrega
seis endpoints da [PokéAPI v2](https://pokeapi.co/) e entrega ao React só o que a tela precisa.

| Camada            | Stack                                                                                                     |
| ----------------- | --------------------------------------------------------------------------------------------------------- |
| Monorepo          | pnpm workspaces · TypeScript `strict` ponta a ponta                                                       |
| Backend (BFF)     | Node 22 · Fastify 5 · Zod 4 · cache em memória (TTL 24 h)                                                 |
| Frontend          | React 19 · Vite 7 · React Router 7 · TanStack Query 5                                                     |
| Regra de negócio  | `packages/domain` — funções puras, testadas sem rede                                                      |
| Contrato          | `packages/contracts` — schemas Zod, tipos via `z.infer`                                                   |
| Referência visual | Figma "Pokédex (Community)" — ver [ADR-007](docs/adr/0007-referencia-visual-figma-e-desvios-de-layout.md) |

## Como rodar

Pré-requisitos: **Node 22+** e **pnpm 10+** (`corepack enable` instala a versão fixada em
`package.json`).

```bash
pnpm install
pnpm dev          # compila os pacotes e sobe api (:3333) e web (:5173) em paralelo
```

Abra <http://localhost:5173>. O Vite faz proxy de `/api` para o BFF, então não há CORS em dev.

Scripts da raiz (todos recursivos nos workspaces):

| Script           | O que faz                                                |
| ---------------- | -------------------------------------------------------- |
| `pnpm typecheck` | `tsc` em todos os workspaces, incluindo testes           |
| `pnpm lint`      | ESLint (type-aware, `no-explicit-any: error`) + Prettier |
| `pnpm test:run`  | Vitest, uma passada, offline                             |
| `pnpm build`     | `dist/` dos pacotes e da API; bundle do web              |
| `pnpm format`    | Prettier em tudo                                         |

## Os seis endpoints da PokéAPI e onde aparecem

| #   | Endpoint                          | Onde aparece na UI                                        |
| --- | --------------------------------- | --------------------------------------------------------- |
| 1   | `GET /pokemon/{id\|name}`         | Grade e detalhe: id, nome, tipos, stats, sprites, medidas |
| 2   | `GET /pokemon-species/{id\|name}` | Descrição, gênero taxonômico, habitat, lendário/mítico    |
| 3   | `GET /type/{name}`                | Filtro por tipo **e** cálculo de fraquezas                |
| 4   | `GET /evolution-chain/{id}`       | Seção "Evolução" do detalhe                               |
| 5   | `GET /ability/{name}`             | Habilidades com efeito resumido                           |
| 6   | `GET /generation/{name}`          | Filtro por geração e rótulo "Geração" no detalhe          |

O navegador **nunca** chama `pokeapi.co`: só o BFF, em `apps/api/src/infrastructure/`.

## Arquitetura

```
apps/web ──┐
           ├──► packages/contracts ◄── apps/api ──► packages/domain ──► packages/contracts
apps/api ──┘
```

As decisões estão registradas em [`docs/adr/`](docs/adr/). A especificação completa de execução
está em [`docs/AGENTS.md`](docs/AGENTS.md), e o que cada etapa entregou, em
[`docs/handoff/`](docs/handoff/). A rodada de revisão adversarial que fechou o projeto — bugs
encontrados, correções e o que foi examinado e mantido — está em
[`docs/handoff/revisao-final.md`](docs/handoff/revisao-final.md).

## Deploy

| Peça  | Onde                                                | Configuração              |
| ----- | --------------------------------------------------- | ------------------------- |
| Front | Vercel · <https://pokedex-art-ng-sc-web.vercel.app> | Root Directory `apps/web` |
| BFF   | Render · <https://pokedexartngsc.onrender.com>      | Root Directory `apps/api` |

O browser fala **só** com o domínio da Vercel: `apps/web/vercel.json` encaminha `/api/*` ao Render
e devolve `index.html` para as rotas do React Router. Sem isso, `/api/v1/pokemon` e `/pokemon/1`
respondem `404`. O porquê está em
[ADR-008](docs/adr/0008-deploy-vercel-render-com-rewrite-same-origin.md).

Trocar o backend de endereço é editar o `destination` do primeiro rewrite — o bundle não muda.

O plano free do Render hiberna a instância após 15 min sem tráfego. O workflow
[`keepalive.yml`](.github/workflows/keepalive.yml) faz `GET /api/v1/health` a cada 10 min para
manter o BFF de pé, com a folga que o atraso da fila do Actions exige —
[ADR-009](docs/adr/0009-keep-alive-do-bff-por-github-actions.md) explica por que 16 min não
serviria e o que isso custa nos dois tetos de cota envolvidos.

## Limitações conhecidas

- **Textos em inglês.** A PokéAPI não tem tradução para português (`pokemon-species/1` tem 28
  entradas em `en` e 0 em `pt`). A interface é em PT-BR; descrições e efeitos de habilidade vêm
  em inglês. É limitação da fonte, não bug.
- **Primeira carga de uma página da lista** dispara até 24 `GET /pokemon/{id}` no BFF (≈272 KB
  cada, do lado do servidor). Depois disso o cache de 24 h responde em milissegundos.
- **Fair use.** A PokéAPI pede cache local e pode banir IPs que o ignorem. O cache do BFF é
  requisito de conformidade, não otimização.

## Verificação

```bash
pnpm install && pnpm typecheck && pnpm lint && pnpm test:run && pnpm build
```

Contrato vivo (com a API rodando). Sem `jq`, use `node -e`:

```bash
curl -s localhost:3333/api/v1/pokemon/charizard | node -e "const d=JSON.parse(require('fs').readFileSync(0));console.log(d.weaknesses)"
curl -s "localhost:3333/api/v1/pokemon?generation=generation-i" | node -e "console.log(JSON.parse(require('fs').readFileSync(0)).total)"   # 151
curl -s localhost:3333/api/v1/types | node -e "console.log(JSON.parse(require('fs').readFileSync(0)).length)"        # 18
curl -s localhost:3333/api/v1/generations | node -e "console.log(JSON.parse(require('fs').readFileSync(0)).length)"  # 9
```

## Status

| Onda | Agente                                               | Estado    |
| ---- | ---------------------------------------------------- | --------- |
| 0    | A0 — fundação e tooling                              | concluído |
| 1    | A1 — contratos                                       | concluído |
| 2    | A2 — domínio · A3 — adapter PokéAPI · A5 — shell web | concluído |
| 3    | A4 — API HTTP · A6 — telas                           | concluído |
| 4    | integração e verificação final                       | concluído |
| —    | revisão adversarial e correções                      | concluído |
