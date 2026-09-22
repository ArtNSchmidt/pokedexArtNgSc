# Pokédex Monorepo — Especificação de Execução para Múltiplos Agentes

> **Documento normativo.** Ele não descreve o que a aplicação *poderia* ser: ele define o que
> cada agente **deve** construir, com quais arquivos pode mexer e como provar que terminou.
> Onde este documento e o hábito de um agente divergirem, este documento vence.

| Campo | Valor |
|---|---|
| Projeto | Pokédex Web (trabalho universitário) |
| Arquitetura | Monorepo pnpm + TypeScript `strict` ponta a ponta |
| Backend | Node 22 + Fastify atuando como **BFF** sobre a PokéAPI v2 |
| Frontend | React 19 + Vite, **mobile-first** |
| Fonte de dados | PokéAPI v2 — `https://pokeapi.co/api/v2` (pública, somente `GET`, sem autenticação) |
| Endpoints consumidos | **6** — `/pokemon`, `/pokemon-species`, `/type`, `/evolution-chain`, `/ability`, `/generation` |
| Agentes | 7 (A0…A6), com fronteiras de arquivo mutuamente exclusivas |
| Data da verificação da API | 2026-09-22 |

---

## 0. Como usar este documento

1. **Todo agente lê as seções §1 a §6.** São o contrato comum: sem elas, dois agentes produzem
   código que não se encaixa.
2. **Depois, o agente lê apenas a sua subseção em §7** e ignora as dos outros. A subseção diz o
   que ele possui, o que pode apenas ler, o que entrega e como se verifica.
3. **Nenhum agente edita arquivo que não lhe pertence** (tabela em §7.1). Se precisar de uma
   mudança fora do seu território, ele **não a faz**: registra um pedido em
   `docs/handoff/requests.md` e segue com o que é possível. Esta é a única regra cuja violação
   invalida a entrega do agente, porque ela é o que torna o trabalho paralelo possível.
4. Ao terminar, o agente escreve `docs/handoff/<agente>.md` (§10.2) e nada mais.

---

## 1. O produto

Uma Pokédex consultável no celular. Cinco telas, nenhuma a mais:

| Tela | Rota | O que faz | Endpoints por trás |
|---|---|---|---|
| Lista | `/` | Grade paginada de Pokémon, busca por nome e filtros por tipo e geração | `/pokemon`, `/type`, `/generation` |
| Detalhe | `/pokemon/:name` | Artwork, tipos, stats, medidas, descrição, habilidades, fraquezas | `/pokemon`, `/pokemon-species`, `/ability`, `/type` |
| Evolução | (seção do detalhe) | Cadeia evolutiva com a condição de cada estágio | `/evolution-chain` |
| Erro | qualquer | Estado de falha legível, com ação de repetir | — |
| Vazio | `/` | "Nenhum Pokémon encontrado" quando o filtro não casa | — |

**Fora de escopo** (não implemente, não peça permissão, apenas não faça): autenticação, banco de
dados, favoritos, comparação, times, movimentos (`/move`), itens (`/item`), modo escuro,
internacionalização, PWA/offline.

### 1.1 Requisito acadêmico dos 5 endpoints

O trabalho exige no mínimo cinco endpoints da API pública. Entregamos **seis**, e cada um precisa
estar **visivelmente em uso na interface** — um endpoint chamado mas não exibido não conta:

| # | Endpoint PokéAPI | Onde aparece na UI | Sem ele, o que quebra |
|---|---|---|---|
| 1 | `GET /pokemon/{id\|name}` | Grade e detalhe (id, nome, tipos, stats, sprites, medidas) | Tudo |
| 2 | `GET /pokemon-species/{id\|name}` | Descrição (flavor text), gênero taxonômico, habitat, lendário/mítico | Texto do detalhe |
| 3 | `GET /type/{name}` | Filtro por tipo **e** cálculo de fraquezas | Filtro e fraquezas |
| 4 | `GET /evolution-chain/{id}` | Seção "Evolução" do detalhe | Cadeia evolutiva |
| 5 | `GET /ability/{name}` | Lista de habilidades com efeito resumido | Efeito das habilidades |
| 6 | `GET /generation/{name}` | Filtro por geração e rótulo "Geração" no detalhe | Filtro por geração |

---

## 2. Fatos verificados da PokéAPI

Tudo nesta seção foi **medido** contra a API real em 2026-09-22, não presumido. Os agentes devem
tratar estes fatos como dados de entrada do projeto.

### 2.1 Política de uso e cache

A API é de consumo apenas (`GET`), sem autenticação e sem rate limit desde a migração para
hospedagem estática. Em troca, a **fair use policy** exige explicitamente:
*"Locally cache resources whenever you request them."* Os cabeçalhos de resposta confirmam a
intenção:

```
cache-control: public, max-age=86400, s-maxage=86400
access-control-allow-origin: *
```

> **CUIDADO:** desrespeitar a política pode resultar em banimento permanente do IP. O cache do
> BFF (§3, ADR-002) não é otimização — é requisito de conformidade.

### 2.2 Custo real de cada recurso

| Recurso | Payload medido | Observação |
|---|---|---|
| `/pokemon/1` | **272.094 bytes** | 86 entradas em `moves`, que **não usamos**. Ver ADR-001. |
| `/pokemon-species/1` | 33.039 bytes | 28 `flavor_text_entries` só em inglês |
| `/type/12` | 25.188 bytes | 156 Pokémon listados; só `damage_relations` interessa |
| `/ability/65` | 25.982 bytes | Só `effect_entries[language=en].short_effect` interessa |
| `/generation/1` | 24.005 bytes | 151 espécies |
| `/evolution-chain/1` | 2.023 bytes | Estrutura recursiva |
| `/pokemon?limit=100000` | 93.324 bytes em 0,27 s | Índice completo: 1.351 entradas |

A conclusão é o projeto inteiro: **o navegador nunca deve falar com a PokéAPI**. Uma grade de 24
cards renderizada com chamadas diretas custaria ~6,5 MB ao celular do usuário. O BFF busca,
projeta e devolve ~4 KB.

### 2.3 Armadilhas confirmadas (todas já custaram bug em projeto real)

1. **A PokéAPI não tem busca por substring.** Não existe `?q=` nem `?search=`. A busca precisa ser
   feita sobre um índice local (ADR-003).
2. **`/pokemon` mistura espécies e formas alternativas.** São 1.351 entradas: os ids `1…1025` são
   a Pokédex nacional (contíguos, verificado) e **326 entradas têm id ≥ 10001** — megas, formas
   regionais, variantes de gênero (`meowstic-female-mega`, id 10326). A Pokédex usa **apenas
   `id ≤ 1025`**.
3. **`/type` retorna 21 tipos, não 18.** Além dos 18 canônicos vêm `stellar`, `unknown` e
   `shadow`, que não pertencem à tabela de efetividade clássica e **devem ser filtrados**.
4. **O nome da espécie nem sempre é o nome do Pokémon.** `/pokemon/386` chama-se `deoxys-normal`,
   mas sua `species` é `deoxys`. Sempre derive a espécie de `pokemon.species.url`, nunca de
   `pokemon.name`.
5. **`flavor_text` vem com quebras de controle.** Valor bruto real:
   `'A strange seed was\nplanted on its\nback at birth.\x0cThe plant sprouts\nand grows with\nthis POKéMON.'`
   Contém `\n` e `\f` (form feed, `\x0c`). Precisa ser sanitizado (Anexo C).
6. **Não há tradução para português.** `pokemon-species/1` tem 28 entradas em `en` e **0 em `pt`**.
   A UI é em português; os textos vindos da API ficam em inglês. Isso é uma limitação da fonte,
   deve ser dito no README e não é bug.
7. **Campos nulos são normais.** `habitat` é `null` para espécies da geração IX (verificado em
   `pokemon-species/906`, Sprigatito); `evolves_from_species` é `null` em todo Pokémon base;
   `baby_trigger_item` é quase sempre `null`. Modele como `T | null` **explícito** e trate na
   borda — nunca `!` nem `any`.
8. **`evolution_details` é uma lista, não um objeto.** Rattata → Raticate traz **duas** entradas
   (nível 20, e nível 20 à noite para a forma de Alola). E a cadeia ramifica: Eevee tem **8**
   filhos diretos. A UI precisa aguentar largura, não só profundidade.
9. **404 tem corpo próprio:** `{"status":404,"message":"Not Found"}` com `content-type` JSON.
   Não confie no corpo: decida pelo `response.status`.

---

## 3. Decisões arquiteturais

Cada decisão abaixo vira um arquivo em `docs/adr/` (responsabilidade do A0), no formato
contexto → alternativa descartada → decisão → consequência.

**ADR-001 — O backend é um BFF, não um proxy.**
Repassar o JSON da PokéAPI seria mais simples, mas empurraria 272 KB e a normalização de dados
para o celular. O BFF agrega os 6 endpoints, projeta só o necessário e devolve um modelo estável.
*Alternativa descartada:* proxy transparente — barato de escrever, caro de consumir, e deixaria o
React acoplado ao formato de terceiro.

**ADR-002 — Cache em memória com TTL de 24 h, atrás de uma porta.**
A `Cache` é uma interface do domínio; a implementação (`InMemoryTtlCache`) é infraestrutura. TTL de
86.400 s espelha o `max-age` do upstream. *Alternativa descartada:* Redis — correto em produção,
mas adiciona Docker e uma dependência que o avaliador teria de subir para rodar o trabalho.

**ADR-003 — Busca e filtros resolvidos sobre um índice carregado no bootstrap.**
Como a API não busca por substring (§2.3.1), o BFF carrega `/pokemon?limit=1025&offset=0` uma vez
(93 KB, 0,27 s) e mantém em memória um índice `{ id, name, normalizedName }`. Busca e paginação
são operações locais, em microssegundos. *Alternativa descartada:* buscar sob demanda no upstream
a cada tecla — impossível, a API não oferece a operação.

**ADR-004 — `packages/contracts` é a única fonte de verdade de tipos.**
Backend e frontend importam o **mesmo** schema Zod. O tipo TypeScript é derivado com
`z.infer`, nunca redigitado. Um `curl` que quebre o contrato quebra o type-check dos dois lados na
mesma hora. *Alternativa descartada:* duplicar interfaces em cada app — divergem em uma semana.

**ADR-005 — Regra de negócio vive em `packages/domain`, em funções puras.**
Cálculo de fraquezas, achatamento da cadeia evolutiva e sanitização de texto não conhecem HTTP,
Fastify nem React. São funções puras, testadas sem rede. *Alternativa descartada:* colocá-las no
controller Fastify — impede teste rápido e torna a UI dependente do servidor para lógica que é do
domínio.

**ADR-006 — Dependências apontam para dentro.**

```
apps/web ──┐
           ├──► packages/contracts ◄── apps/api ──► packages/domain ──► packages/contracts
apps/api ──┘
```

`packages/domain` **não** importa `apps/*`. `packages/contracts` não importa ninguém. Uma seta ao
contrário é falha de revisão, não questão de gosto.

---

## 4. Estrutura do monorepo

```
pokedex/
├── package.json                 # workspaces + scripts raiz          [A0]
├── pnpm-workspace.yaml                                               [A0]
├── tsconfig.base.json           # strict; herdado por todos          [A0]
├── eslint.config.js             # flat config                        [A0]
├── .prettierrc / .gitignore / .nvmrc                                 [A0]
├── .github/workflows/ci.yml                                          [A0]
├── README.md                                                         [A0]
├── docs/
│   ├── adr/000X-*.md                                                 [A0]
│   └── handoff/<agente>.md + requests.md                             [cada agente, o seu]
├── packages/
│   ├── contracts/               # schemas Zod + tipos + fixtures     [A1]
│   │   └── src/{pokemon,type,generation,error,fixtures}.ts
│   └── domain/                  # funções puras + portas             [A2]
│       └── src/{weakness,evolution,text,units,ports}.ts
└── apps/
    ├── api/
    │   └── src/
    │       ├── infrastructure/  # cliente PokéAPI, cache, mappers    [A3]
    │       ├── application/     # casos de uso                       [A4]
    │       ├── interface/       # Fastify: rotas, erros, plugins     [A4]
    │       └── main.ts          # composition root                   [A4]
    └── web/
        ├── index.html                                                [A5]
        └── src/
            ├── app/             # router, providers, layout          [A5]
            ├── shared/          # design system, api client, hooks   [A5]
            ├── styles/          # tokens CSS                         [A5]
            └── features/        # telas (lista, detalhe, evolução)   [A6]
```

---

## 5. Regras inegociáveis (valem para os 7 agentes)

### 5.1 TypeScript

* `strict: true`, `noUncheckedIndexedAccess: true`, `exactOptionalPropertyTypes: true`.
* **Zero `any`.** Zero `as` para calar o compilador. Zero `!` (non-null assertion). Dado que pode
  faltar é `T | null` e é tratado. Se o tipo está difícil, o modelo está errado.
* Estado impossível é **inalcançável por construção**: use união discriminada, não flags soltas.
  `{ status: 'loading' } | { status: 'error'; error: E } | { status: 'ready'; data: T }`, nunca
  `{ isLoading, error, data }` — esse último permite `isLoading && error` e mente.

### 5.2 Fronteiras

* `packages/domain` não importa `fastify`, `react`, `node:http` nem `zod` de runtime na lógica.
* `apps/web` **nunca** chama `pokeapi.co`. A URL literal `pokeapi.co` só pode aparecer em
  `apps/api/src/infrastructure/`. Um `grep` prova isso (§10.3).
* O SDK/HTTP de terceiro não vaza: o resto do código depende da **sua** abstração.

### 5.3 Validação e erro

* Toda entrada externa é validada **na borda**: query string com Zod no Fastify; resposta da
  PokéAPI com Zod antes de virar domínio.
* Erro de negócio é exceção tipada (`PokemonNotFoundError`, `UpstreamUnavailableError`), traduzida
  para HTTP **num único lugar** (error handler do Fastify). Controller não monta corpo de erro.
* Nenhuma função utilitária lança por entrada inválida: retorna valor total. `sanitizeFlavorText(null)`
  devolve `null`, não explode.

### 5.4 Estados completos na UI

Toda operação assíncrona trata **loading, vazio, erro e sucesso**. Uma tela que só renderiza o
caminho feliz está incompleta, mesmo que "funcione".

### 5.5 Higiene

* Sem `console.log` (use o logger do Fastify no backend; nada no frontend).
* Sem código comentado, sem `TODO` vago, sem arquivo morto.
* Comentário explica **por quê**, nunca **o quê**. Se precisa explicar o quê, renomeie.
* Nomes: classes e variáveis são substantivos; funções são verbos; uma palavra por conceito
  (`fetch…` OU `get…`, nunca os dois para a mesma ideia).
* Funções pequenas, um nível de abstração cada, ≤ 3 parâmetros, sem parâmetro booleano que troca
  comportamento (divida em duas funções).

### 5.6 Nunca versione

`.env`, segredos, `node_modules/`, `dist/`, arquivos de IDE pessoal. Não há segredo neste projeto
— a API é pública. Se algum aparecer, é erro.

---

## 6. Contrato da API interna (CONGELADO)

Este é o ponto de encontro entre backend e frontend. Depois que o **A1** o publicar, ele **não
muda por iniciativa de ninguém**: alteração exige pedido em `docs/handoff/requests.md` e nova
versão entregue pelo A1. O A4 e o A6 programam contra ele; o A6 pode trabalhar com as *fixtures*
do A1 antes de o backend existir.

**Base URL:** `http://localhost:3333/api/v1` · **Content-Type:** `application/json; charset=utf-8`

### 6.1 Rotas

| Método | Rota | Query | Resposta 200 |
|---|---|---|---|
| GET | `/health` | — | `{ status: 'ok', indexSize: number }` |
| GET | `/pokemon` | `page`, `pageSize`, `q`, `type`, `generation` | `PokemonListPage` |
| GET | `/pokemon/:idOrName` | — | `PokemonDetail` |
| GET | `/types` | — | `TypeOption[]` |
| GET | `/generations` | — | `GenerationOption[]` |

Regras de query em `/pokemon`:

* `page`: inteiro ≥ 1, padrão `1`.
* `pageSize`: inteiro entre 1 e 60, padrão `24`.
* `q`: string livre, 1 a 40 caracteres; comparação **sem acento e sem caixa** (Anexo B).
* `type`: um dos 18 tipos canônicos; qualquer outro valor → `400 VALIDATION_ERROR`.
* `generation`: `generation-i` … `generation-ix`.
* `q`, `type` e `generation` são combináveis e se aplicam como **interseção**.

### 6.2 Tipos (definidos em `packages/contracts`, derivados de Zod)

```ts
export const TYPE_NAMES = [
  'normal','fighting','flying','poison','ground','rock','bug','ghost','steel',
  'fire','water','grass','electric','psychic','ice','dragon','dark','fairy',
] as const;
export type TypeName = (typeof TYPE_NAMES)[number];

export type StatName =
  | 'hp' | 'attack' | 'defense' | 'special-attack' | 'special-defense' | 'speed';

/** Multiplicadores possíveis; 1 é omitido da lista de fraquezas. */
export type DamageMultiplier = 0 | 0.25 | 0.5 | 2 | 4;

export interface PokemonSummary {
  id: number;              // 1..1025
  name: string;            // slug da API: "mr-mime"
  displayName: string;     // para exibir: "Mr Mime"
  types: TypeName[];       // ordenado por slot; 1 ou 2 itens
  spriteUrl: string;       // sprites.front_default
}

export interface PokemonListPage {
  items: PokemonSummary[];
  page: number;
  pageSize: number;
  total: number;           // total APÓS filtros
  totalPages: number;
}

export interface StatValue  { name: StatName; base: number; effort: number }
export interface AbilityView { name: string; displayName: string; isHidden: boolean; shortEffect: string | null }
export interface Weakness    { type: TypeName; multiplier: DamageMultiplier }

export interface EvolutionStep {
  from: string;                 // slug da espécie de origem
  to: string;                   // slug da espécie de destino
  trigger: string | null;       // "level-up", "use-item", "trade"...
  minLevel: number | null;
  item: string | null;
  minHappiness: number | null;
  timeOfDay: string | null;     // "" da API vira null
}

export interface PokemonDetail extends PokemonSummary {
  artworkUrl: string | null;    // sprites.other['official-artwork'].front_default
  cryUrl: string | null;        // cries.latest
  heightMeters: number;         // height / 10   (API usa decímetros)
  weightKilograms: number;      // weight / 10   (API usa hectogramas)
  baseExperience: number | null;
  genus: string | null;         // genera[language=en].genus
  flavorText: string | null;    // sanitizado (Anexo C)
  generation: string;           // "generation-i"
  habitat: string | null;       // null em gerações recentes
  isLegendary: boolean;
  isMythical: boolean;
  stats: StatValue[];           // 6 itens, na ordem de StatName
  abilities: AbilityView[];
  evolution: EvolutionStep[];   // cadeia achatada; [] se não evolui
  weaknesses: Weakness[];       // só multiplicador != 1, ordenado desc
}

export interface TypeOption       { name: TypeName; displayName: string }
export interface GenerationOption { name: string; displayName: string; region: string }
```

### 6.3 Erros

Formato único, em todas as rotas:

```jsonc
{ "error": { "code": "POKEMON_NOT_FOUND", "message": "Pokémon 'missingno' não encontrado." } }
```

| HTTP | `code` | Quando |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Query inválida (tipo inexistente, `pageSize` fora da faixa) |
| 404 | `POKEMON_NOT_FOUND` | Upstream respondeu 404, ou id fora de 1..1025 |
| 502 | `UPSTREAM_UNAVAILABLE` | PokéAPI indisponível, timeout ou 5xx |
| 500 | `INTERNAL_ERROR` | Qualquer outra falha (mensagem genérica; detalhe só no log) |

> **CUIDADO:** a mensagem de erro é exibida ao usuário. Nunca vaze stack trace, URL interna nem o
> corpo do upstream para o cliente.

### 6.4 Exemplo verificável

```bash
curl -s localhost:3333/api/v1/pokemon/charizard | jq '{name, types, weaknesses}'
```

Saída esperada (valores conferidos contra a PokéAPI real em 2026-09-22):

```jsonc
{
  "name": "charizard",
  "types": ["fire", "flying"],
  "weaknesses": [
    { "type": "rock",     "multiplier": 4 },
    { "type": "electric", "multiplier": 2 },
    { "type": "water",    "multiplier": 2 },
    { "type": "fairy",    "multiplier": 0.5 },
    { "type": "fighting", "multiplier": 0.5 },
    { "type": "fire",     "multiplier": 0.5 },
    { "type": "steel",    "multiplier": 0.5 },
    { "type": "bug",      "multiplier": 0.25 },
    { "type": "grass",    "multiplier": 0.25 },
    { "type": "ground",   "multiplier": 0 }
  ]
}
```

---

## 7. Os agentes

### 7.1 Mapa de propriedade de arquivos

Cada linha é território exclusivo. **Escrever fora do próprio território invalida a entrega.**

| Agente | Papel | Branch | Possui (escreve) | Lê (não escreve) |
|---|---|---|---|---|
| **A0** | Fundação e tooling | `chore/a0-foundation` | Todos os manifests e configs: `package.json` (raiz e dos 4 workspaces), `pnpm-workspace.yaml`, `tsconfig*.json`, `eslint.config.js`, `.prettierrc`, `.gitignore`, `.nvmrc`, `vite.config.ts`, `vitest.config.ts`, `.github/workflows/ci.yml`, `README.md`, `docs/adr/**` | — |
| **A1** | Contratos | `feat/a1-contracts` | `packages/contracts/src/**` | §6 |
| **A2** | Domínio | `feat/a2-domain` | `packages/domain/src/**` | `packages/contracts/src/**` |
| **A3** | Adapter PokéAPI | `feat/a3-pokeapi-adapter` | `apps/api/src/infrastructure/**` | `packages/{contracts,domain}/src/**` |
| **A4** | API HTTP | `feat/a4-http-api` | `apps/api/src/application/**`, `apps/api/src/interface/**`, `apps/api/src/main.ts` | `apps/api/src/infrastructure/**`, `packages/**` |
| **A5** | Shell web + design system | `feat/a5-web-shell` | `apps/web/index.html`, `apps/web/src/app/**`, `apps/web/src/shared/**`, `apps/web/src/styles/**`, `apps/web/src/main.tsx` | `packages/contracts/src/**` |
| **A6** | Telas web | `feat/a6-web-features` | `apps/web/src/features/**` | `apps/web/src/{app,shared,styles}/**`, `packages/contracts/src/**` |

`docs/handoff/<agente>.md` pertence sempre ao próprio agente. `docs/handoff/requests.md` é o único
arquivo de escrita compartilhada — e só se acrescenta ao fim dele, nunca se edita linha alheia.

---

### 7.2 A0 — Fundação e tooling

**Objetivo.** Deixar o repositório em estado onde `pnpm install && pnpm typecheck && pnpm lint`
passa com os workspaces vazios. Todo mundo depende disso; ninguém começa antes.

**Entregáveis.**

1. `pnpm-workspace.yaml` com `packages/*` e `apps/*`.
2. `package.json` raiz com os scripts que todos os outros agentes vão usar para se verificar:
   `dev`, `build`, `typecheck`, `lint`, `test`, `test:run`.
3. `tsconfig.base.json`: `target ES2022`, `module NodeNext`, `strict`, `noUncheckedIndexedAccess`,
   `exactOptionalPropertyTypes`, `noUnusedLocals`, `noUnusedParameters`, `isolatedModules`.
4. Os 4 `package.json` de workspace, com as dependências **já declaradas** (os outros agentes não
   podem editar manifests):
   * `packages/contracts`: `zod`
   * `packages/domain`: `@pokedex/contracts` (workspace)
   * `apps/api`: `fastify`, `@fastify/cors`, `zod`, `@pokedex/contracts`, `@pokedex/domain`; dev:
     `tsx`, `vitest`, `typescript`
   * `apps/web`: `react`, `react-dom`, `react-router-dom`, `@tanstack/react-query`,
     `@pokedex/contracts`; dev: `vite`, `@vitejs/plugin-react`, `typescript`
5. `vite.config.ts` com proxy de `/api` para `http://localhost:3333` (evita CORS em dev).
6. ESLint flat config + Prettier. Regra obrigatória: `@typescript-eslint/no-explicit-any: error`.
7. CI (`.github/workflows/ci.yml`): `install → typecheck → lint → test:run → build`, em Node 22.
8. `README.md`: como rodar, o que é, os 6 endpoints, e a nota de que os textos da PokéAPI só
   existem em inglês (§2.3.6).
9. Os ADRs de §3 em `docs/adr/`.

**Restrição.** Não escreva **nenhum** código de aplicação — nem um `index.ts` de exemplo. Um
`src/index.ts` vazio com `export {}` é aceitável apenas se o build exigir.

**Verificação (cole a saída real no handoff).**

```bash
pnpm install && pnpm typecheck && pnpm lint
node -v   # deve ser 22.x
```

---

### 7.3 A1 — Contratos

**Objetivo.** Transcrever §6 em schemas Zod, publicar os tipos derivados e fornecer *fixtures* que
permitam a A2, A4 e A6 trabalharem antes de existir rede.

**Entregáveis.**

* `src/type.ts` — `TYPE_NAMES`, `typeNameSchema`, `typeOptionSchema`, `displayName` em português
  quando fizer sentido (`fire` → "Fogo").
* `src/pokemon.ts` — `pokemonSummarySchema`, `statValueSchema`, `abilityViewSchema`,
  `weaknessSchema`, `evolutionStepSchema`, `pokemonDetailSchema`, `pokemonListPageSchema`,
  `listQuerySchema` (com `coerce` para `page`/`pageSize` e os defaults de §6.1).
* `src/generation.ts` — `generationOptionSchema` e as 9 gerações com nome de exibição e região.
* `src/error.ts` — `apiErrorCodeSchema`, `apiErrorSchema`.
* `src/fixtures.ts` — pelo menos: `charizardDetail` (com as 10 fraquezas de §6.4), `bulbasaurDetail`,
  `eeveeDetail` (cadeia com 8 ramos), `sprigatitoDetail` (`habitat: null`), `listPageFixture` com
  24 itens. **Cada fixture é validada pelo próprio schema em um teste** — fixture que não passa no
  schema é mentira documentada.
* `src/index.ts` — reexporta tudo.

**Regras.** O tipo TypeScript **nunca** é escrito à mão: `export type X = z.infer<typeof xSchema>`.
Nenhum schema aqui conhece o formato da PokéAPI — este pacote descreve **nosso** contrato; o
formato do terceiro é problema do A3.

**Definition of Done.**

* `pnpm --filter @pokedex/contracts typecheck` limpo.
* Teste que valida cada fixture contra seu schema, verde.
* `docs/handoff/a1.md` com a lista de símbolos exportados (é o que A4 e A6 vão consultar).

---

### 7.4 A2 — Domínio (funções puras)

**Objetivo.** As três regras de negócio do projeto, sem rede, sem framework, com teste.

**Entregáveis.**

| Arquivo | Função | Contrato |
|---|---|---|
| `src/weakness.ts` | `calculateWeaknesses(types, relations)` | Anexo A |
| `src/evolution.ts` | `flattenEvolutionChain(chain)` | Anexo B |
| `src/text.ts` | `sanitizeFlavorText(raw)`, `toDisplayName(slug)`, `normalizeForSearch(value)` | Anexo C |
| `src/units.ts` | `decimetersToMeters`, `hectogramsToKilograms` | divisão por 10, uma casa |
| `src/ports.ts` | `interface Cache`, `interface PokemonRepository` | portas (ADR-002/006) |

**Testes obrigatórios (Vitest), com os valores já verificados contra a API real:**

* `charizard` (fire/flying) → `rock: 4`, `water: 2`, `electric: 2`, `fighting/fire/steel/fairy: 0.5`,
  `bug/grass: 0.25`, `ground: 0`.
* `bulbasaur` (grass/poison) → `fire/flying/ice/psychic: 2`, `electric/fairy/fighting/water: 0.5`,
  `grass: 0.25`.
* `sableye` (dark/ghost) → `fairy: 2`, `poison: 0.5`, `fighting/normal/psychic: 0` — caso de
  imunidade tripla, o que quebra implementação que soma em vez de multiplicar.
* Tipo único: o resultado nunca tem multiplicador 4 nem 0.25.
* `flattenEvolutionChain` na cadeia 1 (Bulbasaur) → exatamente 2 passos, níveis 16 e 32.
* `flattenEvolutionChain` na cadeia de Eevee → 8 passos a partir do mesmo `from`.
* `flattenEvolutionChain` em cadeia sem evolução → `[]`.
* `sanitizeFlavorText` com `\n` e `\f` (o valor literal de §2.3.5) → uma linha, espaços colapsados.
* `sanitizeFlavorText(null)` → `null` (não lança).

**Regras.** Nenhum `import` de `fastify`, `react`, `node:http` ou `fetch`. Nenhuma função aqui
conhece HTTP. Os testes rodam offline; se algum precisa de rede, está errado.

**Definition of Done.** `pnpm --filter @pokedex/domain test:run` verde, com a contagem de testes
colada no handoff.

---

### 7.5 A3 — Adapter da PokéAPI

**Objetivo.** Ser o **único** lugar do repositório que conhece `pokeapi.co`. Implementa
`PokemonRepository` (porta do A2) usando `fetch` nativo do Node 22.

**Entregáveis.**

* `infrastructure/http/pokeApiClient.ts` — `GET` com timeout via `AbortSignal.timeout(8000)`,
  mapeando `404 → PokemonNotFoundError` e `5xx|timeout|rede → UpstreamUnavailableError`.
* `infrastructure/cache/inMemoryTtlCache.ts` — implementa `Cache`; TTL padrão 86.400 s; limite de
  entradas com descarte do mais antigo. **Deduplica requisições em voo**: duas chamadas
  concorrentes à mesma chave compartilham uma promessa, não duas idas à rede.
* `infrastructure/pokeapi/schemas.ts` — schemas Zod do **formato do terceiro** (só os campos que
  usamos; `.passthrough()` para não quebrar quando a PokéAPI adicionar campos).
* `infrastructure/pokeapi/mappers.ts` — funções puras DTO → contrato do A1.
* `infrastructure/pokeapi/pokemonIndex.ts` — o índice de ADR-003: carrega
  `/pokemon?limit=1025&offset=0` no bootstrap, guarda `{ id, name, normalizedName }` e expõe
  `search`, `page`, `size`.
* `infrastructure/pokeapi/pokeApiPokemonRepository.ts` — implementa a porta, orquestrando os 6
  endpoints.

**Cuidados que são requisito, não sugestão.**

1. Filtre `id ≤ 1025` em toda listagem (§2.3.2). O id vem do fim da URL: `/pokemon/25/` → `25`.
2. Descarte `stellar`, `unknown` e `shadow` ao expor tipos (§2.3.3).
3. Derive a espécie de `pokemon.species.url`, jamais de `pokemon.name` (§2.3.4).
4. Ao montar o detalhe, **busque em paralelo** (`Promise.all`) espécie, cadeia evolutiva,
   habilidades e relações de dano dos tipos. Sequencial multiplica a latência por 4.
5. As relações de dano dos 18 tipos são carregadas **uma vez** e ficam em cache: são a entrada de
   `calculateWeaknesses` e mudam nunca.
6. O mapper **não** calcula fraqueza nem achata evolução — ele chama `packages/domain`. Duplicar a
   regra aqui é o erro que este documento mais quer evitar.

**Definition of Done.**

* Teste de mapper usando **fixture JSON gravada em disco** (`__fixtures__/pokemon-1.json` etc.),
  sem rede.
* Um *learning test* opcional, marcado com `describe.skip`, que bate na API real — documenta o
  formato sem quebrar o CI offline.
* `grep -r "pokeapi.co" apps/ packages/ --include=*.ts` só retorna arquivos deste agente.

---

### 7.6 A4 — API HTTP

**Objetivo.** Expor §6 em Fastify e montar o sistema (composition root).

**Entregáveis.**

* `application/useCases/{listPokemon,getPokemonDetail,listTypes,listGenerations}.ts` — cada caso de
  uso recebe a porta `PokemonRepository` por parâmetro, nunca instancia infraestrutura.
* `interface/http/routes/{pokemon,catalog,health}.routes.ts`.
* `interface/http/errorHandler.ts` — **o único** ponto que traduz exceção → HTTP, conforme §6.3.
* `interface/http/server.ts` — cria a instância Fastify, registra CORS, schemas de validação e
  rotas. Não sobe o processo.
* `main.ts` — composition root: instancia cache, cliente, repositório, casos de uso, servidor;
  aquece o índice; escuta em `3333`; trata `SIGTERM`.

**Regras.**

* Validação de query com `listQuerySchema` do A1. Falha de parse → `400 VALIDATION_ERROR`; nunca
  deixe `NaN` entrar em `page`.
* Rota não faz regra de negócio: recebe, chama caso de uso, responde. Se um handler passa de ~15
  linhas, tem lógica no lugar errado.
* Envie `Cache-Control: public, max-age=300` nas respostas de leitura — é um BFF de dados que mudam
  raramente.

**Definition of Done.**

```bash
pnpm --filter @pokedex/api dev &
curl -s localhost:3333/api/v1/health
curl -s "localhost:3333/api/v1/pokemon?page=1&pageSize=3&type=grass" | jq '.total, .items[].name'
curl -s localhost:3333/api/v1/pokemon/charizard | jq '.weaknesses'   # comparar com §6.4
curl -s -o /dev/null -w '%{http_code}\n' localhost:3333/api/v1/pokemon/missingno   # 404
curl -s -o /dev/null -w '%{http_code}\n' "localhost:3333/api/v1/pokemon?type=banana" # 400
```

As cinco saídas vão no handoff, literais.

---

### 7.7 A5 — Shell web e design system

**Objetivo.** A casca do app: tokens, componentes base, layout mobile-first, roteamento e o cliente
HTTP tipado. **Não implementa nenhuma tela** — isso é do A6.

**Entregáveis.**

* `styles/tokens.css` — variáveis CSS: escala de espaçamento (base 4 px), tipografia fluida,
  raios, sombras, e **as 18 cores de tipo** (`--type-fire`, `--type-water`, …). Cor de tipo é dado
  de design, não `if` espalhado em componente.
* `styles/global.css` — reset, `box-sizing`, `font-family` de sistema, `color-scheme: light`.
* `shared/ui/` — `Card`, `Badge` (chip de tipo, recebe `TypeName`), `SearchInput`, `Select`,
  `Skeleton`, `EmptyState`, `ErrorState` (com botão "Tentar de novo"), `Spinner`, `StatBar`,
  `Pagination`. Todos sem estado de servidor, sem `fetch`, controlados por props.
* `shared/api/client.ts` — `apiGet<T>(path, schema)`: faz `fetch`, valida com o schema do A1 e
  devolve o tipo. Resposta que não casa com o contrato é erro, não `any`.
* `shared/api/queries.ts` — chaves e opções do React Query (`staleTime` de 5 min).
* `app/router.tsx`, `app/providers.tsx`, `app/AppLayout.tsx`, `main.tsx`, `index.html`.

**Mobile-first é requisito mensurável, não estilo.**

* Escreva o CSS base para **360 px** e só depois use `@media (min-width: 640px)` e `1024px`.
  Nenhum `max-width` em media query — a direção é de baixo para cima.
* Alvo de toque mínimo **44 × 44 px** em tudo que é clicável.
* Sem rolagem horizontal em 360 px, em nenhuma tela.
* Imagens com `width`/`height` ou `aspect-ratio` declarados — evita *layout shift* na grade.
* Grade: `repeat(auto-fill, minmax(150px, 1fr))` — 2 colunas no celular, mais no desktop, sem
  breakpoint manual.

**Regras.** Sem biblioteca de componentes (sem MUI, sem Chakra): CSS Modules ou CSS puro com os
tokens. A justificativa é acadêmica — o trabalho deve mostrar domínio de layout, não configuração
de framework de UI.

**Definition of Done.** Uma página de catálogo temporária em `app/` renderizando todos os
componentes em seus estados (normal, loading, erro, vazio), com print em 360 px no handoff.
**Remova essa página antes do merge final** e diga no handoff que removeu.

---

### 7.8 A6 — Telas

**Objetivo.** As três telas, montadas com as peças do A5 e os tipos do A1.

**Entregáveis.**

* `features/pokemon-list/` — `PokemonListPage.tsx`, `PokemonCard.tsx`, `PokemonFilters.tsx`,
  `usePokemonList.ts`.
  * Busca com **debounce de 300 ms**; o termo vive na URL (`?q=`), assim o botão voltar funciona e
    o link é compartilhável.
  * Filtros de tipo e geração também na URL. Trocar filtro volta para `page=1` — esquecer isso
    produz a tela vazia clássica ("página 7 de 2").
  * Estados: skeleton na primeira carga, `EmptyState` quando `total === 0`, `ErrorState` com
    retry.
* `features/pokemon-detail/` — `PokemonDetailPage.tsx`, `StatsPanel.tsx`, `AbilitiesPanel.tsx`,
  `WeaknessPanel.tsx`, `EvolutionPanel.tsx`, `usePokemonDetail.ts`.
  * Cabeçalho com artwork, `#0006`, nome, chips de tipo.
  * Stats com barra proporcional (referência 255, o máximo teórico).
  * Fraquezas agrupadas por multiplicador, em ordem decrescente, com rótulo `×4`, `×2`, `×½`,
    `×¼`, `imune`.
  * Evolução renderizada a partir de `EvolutionStep[]`: **teste com Eevee** — 8 ramos do mesmo
    `from` precisam quebrar linha no celular, não esticar a página.
  * `habitat: null` e `flavorText: null` renderizam "—", nunca "null" nem espaço em branco.

**Regras.**

* Nenhuma chamada a `pokeapi.co`. Só `shared/api/client.ts`.
* Nenhuma regra de negócio: fraqueza, evolução e unidades **já vêm prontas** do backend. Recalcular
  no React duplica a regra e contradiz ADR-005.
* Nenhum componente novo de uso geral aqui: se faltar peça, peça ao A5 via
  `docs/handoff/requests.md` e, enquanto isso, componha as existentes.

**Definition of Done.** Prints em 360 px de: lista carregando, lista com resultado, lista vazia,
erro, detalhe de Charizard (fraquezas conferindo com §6.4) e detalhe de Eevee (8 ramos).

---

## 8. Ordem de execução

```
Onda 0   A0 ──────────────► repositório instalável
Onda 1   A1 ──────────────► contrato congelado + fixtures
Onda 2   A2 ─┐
         A3 ─┼────────────► domínio testado, adapter pronto, shell pronto
         A5 ─┘              (A3 usa a porta do A2; A5 usa os tipos do A1)
Onda 3   A4 ─┐
         A6 ─┘────────────► API respondendo, telas montadas
Onda 4   Integração e verificação final (§10.3)
```

**Regras de sincronização.**

* Ninguém começa uma onda antes de **todos** os handoffs da anterior existirem.
* Na onda 2, o A3 precisa de `ports.ts`. Para não travar, o **A2 entrega `ports.ts` primeiro**,
  como seu primeiro commit, antes das implementações.
* Na onda 3, o A6 **não espera** o A4: desenvolve contra as fixtures do A1 e só troca a fonte no
  fim. Se esperar, a onda 3 vira sequencial e o paralelismo se perde.
* Conflito de merge entre dois agentes é, por construção, impossível (§7.1). Se acontecer, alguém
  escreveu fora do território: reverta o commit intruso, não "resolva" o conflito.

---

## 9. Protocolo de Git

### 9.1 Um arquivo alterado = um commit exclusivo

Proibido `git add .`, `git add -A`, `git commit -a`. Stage explícito, arquivo por arquivo:

```bash
git add packages/domain/src/weakness.ts
git commit -F .gitmessage
git status --short     # confirme que nada mais foi arrastado
```

A ordem dos commits segue a **dependência**: primeiro o que é dependido (tipos, portas, contratos),
depois o que depende (implementações, rotas, telas). O histórico se lê de dentro para fora, igual à
arquitetura.

### 9.2 Formato da mensagem

```
<tipo>(<escopo>): <assunto no imperativo, ≤72 chars, sem ponto final>

Arquivo: <caminho/do/arquivo>

Lógica:
- <como funciona por dentro: fluxo, decisões, estruturas de dados, caso de borda>

Funcionalidades:
- <o que o consumidor passa a poder fazer, ou qual garantia passa a existir>

Motivo:
- <qual problema resolve; por que agora>

Verificação: <comando executado + resultado real>
```

Tipos: `feat`, `fix`, `refactor`, `perf`, `test`, `docs`, `build`, `ci`, `chore`.
Escopos deste projeto: `contracts`, `domain`, `api/infra`, `api/http`, `web/shell`, `web/list`,
`web/detail`, `repo`.

**Proibidos:** "WIP", "ajustes", "correções", "update", "várias melhorias". Se a seção **Lógica**
não cabe em 1–3 linhas claras, o commit está grande demais ou o código não está claro — o problema
é o commit, não a mensagem.

**Exemplo real deste projeto:**

```
feat(domain): calcula fraquezas multiplicando relações de dano por tipo

Arquivo: packages/domain/src/weakness.ts

Lógica:
- Parte de um mapa com os 18 tipos em 1.0 e, para cada tipo do Pokémon,
  multiplica por 2, 0.5 ou 0 conforme double/half/no_damage_from.
- Multiplicar (e não somar) é o que produz x4 em Charizard contra rock e
  preserva a imunidade: zero absorve qualquer fator posterior.
- Entradas com multiplicador 1 são descartadas: a UI só mostra desvio.

Funcionalidades:
- O detalhe passa a exibir fraquezas, resistências e imunidades corretas
  para Pokémon de tipo duplo, incluindo imunidade tripla (Sableye).

Motivo:
- A tabela de efetividade é a única regra do projeto com risco real de
  erro silencioso; isolá-la em função pura a torna testável sem rede.

Verificação: pnpm --filter @pokedex/domain test:run -- weakness  → 6 passed (0 failed)
```

### 9.3 Branches e integração

* Branch por agente (§7.1). **Nunca** commit direto na `main`; a `main` é sempre executável.
* Atualize a branch com `git rebase origin/main`, não com merge da `main` para dentro dela.
* PR por agente, descrevendo: o que entregou, decisão de design, **alternativa descartada e por
  quê**, saída literal da verificação, riscos.
* História publicada não se reescreve: use `git revert`, com corpo explicando a reversão.

---

## 10. Pronto significa isto

### 10.1 Definition of Done por commit

1. Type-check limpo no workspace tocado.
2. Lint limpo.
3. Testes do escopo verdes, com a **saída real** colada na mensagem de commit.
4. Nenhum arquivo fora do território do agente no `git status`.

Commit não verificado não entra. "Deve funcionar" não é verificação.

### 10.2 Handoff de cada agente

Ao terminar, o agente escreve `docs/handoff/<agente>.md` com exatamente estas seções:

```markdown
# Handoff <A?> — <papel>
## O que entreguei
## O que exporto para os outros (símbolos, rotas, componentes)
## Decisões que tomei e a alternativa que descartei
## Verificação (comandos e saída literal)
## Pendências e riscos conhecidos
## Pedidos abertos a outros agentes
```

Honestidade documental é requisito: *stub* é declarado como *stub*. Nada é apresentado como pronto
sem verificação.

### 10.3 Verificação final do sistema (onda 4)

```bash
# 1. Qualidade estática em todo o monorepo
pnpm install && pnpm typecheck && pnpm lint && pnpm test:run && pnpm build

# 2. A fronteira arquitetural (ADR-006) — as três devem sair VAZIAS
grep -rn "pokeapi.co" apps/web packages/ --include=*.ts --include=*.tsx
grep -rn "from 'fastify'\|from \"react\"" packages/domain/src --include=*.ts
grep -rn ": any\|as any" apps packages --include=*.ts --include=*.tsx

# 3. Os 6 endpoints, de fato em uso
grep -rn "pokemon-species\|evolution-chain\|/ability/\|/generation/\|/type/\|/pokemon" \
  apps/api/src/infrastructure --include=*.ts | cut -d: -f1 | sort -u

# 4. Contrato vivo
curl -s localhost:3333/api/v1/pokemon/charizard | jq '.weaknesses'       # == §6.4
curl -s "localhost:3333/api/v1/pokemon?generation=generation-i" | jq '.total'  # 151
curl -s localhost:3333/api/v1/types | jq 'length'                        # 18
curl -s localhost:3333/api/v1/generations | jq 'length'                  # 9

# 5. Mobile-first: DevTools em 360x800, percorrer lista → detalhe → evolução
#    sem rolagem horizontal em nenhuma tela.
```

Os números `151`, `18` e `9` foram medidos na API real e são o gabarito: divergência é bug, não
variação da fonte.

### 10.4 O que reprova a entrega

* Um `any` em qualquer arquivo.
* `apps/web` falando com `pokeapi.co`.
* Regra de fraqueza ou de evolução duplicada fora de `packages/domain`.
* Tela sem tratamento de erro ou de lista vazia.
* Commit agrupando mais de um arquivo.
* `README` que promete o que o código não faz.

---

## Anexo A — Cálculo de fraquezas

**Assinatura.**

```ts
function calculateWeaknesses(
  defenderTypes: readonly TypeName[],
  relationsByType: Readonly<Record<TypeName, DamageRelations>>,
): Weakness[];
```

**Algoritmo.** Comece com todos os 18 tipos atacantes em `1.0`. Para **cada** tipo do defensor,
aplique suas relações defensivas ao acumulador: `double_damage_from` multiplica por `2`,
`half_damage_from` por `0.5`, `no_damage_from` por `0`. Descarte o que sobrou em `1`. Ordene por
multiplicador decrescente e, no empate, por nome.

**Por que multiplicar e não somar.** Multiplicação é o que produz `×4` em tipo duplo com fraqueza
repetida (Charizard contra `rock`) e o que preserva a imunidade: uma vez zerado, nenhum fator
posterior ressuscita o dano. Implementação que soma "pontos de fraqueza" acerta os casos fáceis e
erra Sableye — e erra em silêncio.

**Gabarito de teste** (conferido contra a PokéAPI em 2026-09-22):

| Pokémon | Tipos | Resultado esperado |
|---|---|---|
| charizard | fire, flying | `rock ×4`; `electric, water ×2`; `fairy, fighting, fire, steel ×0.5`; `bug, grass ×0.25`; `ground ×0` |
| bulbasaur | grass, poison | `fire, flying, ice, psychic ×2`; `electric, fairy, fighting, water ×0.5`; `grass ×0.25` |
| sableye | dark, ghost | `fairy ×2`; `poison ×0.5`; `fighting, normal, psychic ×0` |

**Fonte das relações.** `GET /type/{name}` → `damage_relations`, que tem exatamente seis listas:
`no_damage_to`, `half_damage_to`, `double_damage_to`, `no_damage_from`, `half_damage_from`,
`double_damage_from`. Para fraqueza, **só as três `_from` importam** — as `_to` são o ataque, que
não usamos.

---

## Anexo B — Achatamento da cadeia evolutiva e normalização de busca

**Entrada.** `GET /evolution-chain/{id}` devolve uma árvore: `chain` é um `ChainLink` com
`species`, `evolution_details[]` e `evolves_to[]` — recursivo.

**Saída.** `EvolutionStep[]`, uma linha por transição.

**Algoritmo.** Percorra em profundidade carregando o `from` (a espécie do nó pai). O nó raiz não
gera passo — ele é o ponto de partida. Para cada filho, emita **um passo por entrada** de
`evolution_details`; se a lista vier vazia, emita um passo com `trigger: null`.

**Casos que o teste precisa cobrir.**

| Cadeia | Esperado | Por quê |
|---|---|---|
| `/evolution-chain/1` (Bulbasaur) | 2 passos: `bulbasaur→ivysaur` nível 16, `ivysaur→venusaur` nível 32 | linear |
| `/evolution-chain/67` (Eevee) | 8 passos com o mesmo `from: eevee` | ramificação larga |
| `/evolution-chain/7` (Rattata) | 2 passos `rattata→raticate` — nível 20, e nível 20 com `timeOfDay: 'night'` | `evolution_details` com 2 entradas |
| Pokémon sem evolução | `[]` | não renderizar a seção |

**Normalização para busca** (`normalizeForSearch`): minúsculas → `normalize('NFD')` → remove
diacríticos (`/\p{Diacritic}/gu`) → troca não-alfanumérico por `-` → colapsa `-`. Assim
`"Mr. Mime"`, `"mr mime"` e `"MR-MIME"` casam com o slug `mr-mime`. Ordene os resultados pondo os
que **começam** com o termo antes dos que apenas o **contêm** — é o que faz a busca parecer certa.

---

## Anexo C — Texto, nomes e unidades

**`sanitizeFlavorText(raw: string | null): string | null`**

Substitua `\f` (`\x0c`) por espaço, colapse toda sequência de espaço em branco em um único espaço,
apare as pontas. `null` entra, `null` sai — a função não lança.

```
entrada: 'A strange seed was\nplanted on its\nback at birth.\x0cThe plant sprouts\nand grows with\nthis POKéMON.'
saída  : 'A strange seed was planted on its back at birth. The plant sprouts and grows with this POKéMON.'
```

**Escolha da entrada de texto.** Filtre `flavor_text_entries` por `language.name === 'en'` e pegue
a **última** (versão mais recente do jogo). Não existe `pt` (§2.3.6): se um dia existir, a
preferência é `pt` → `en` → `null`.

**`toDisplayName(slug)`.** `mr-mime` → `Mr Mime`; `nidoran-f` → `Nidoran F`. Troque `-` por espaço
e capitalize cada palavra. Não tente ser esperto com casos especiais (`ho-oh`, `porygon-z`):
consistência previsível vale mais que acerto pontual.

**Unidades.** `height` vem em **decímetros** e `weight` em **hectogramas** — ambos se dividem por
10 e se exibem com uma casa decimal: Bulbasaur, `height: 7` e `weight: 69`, vira `0,7 m` e
`6,9 kg`. Exibir `7` e `69` é o erro mais comum e o mais fácil de o professor notar.

---

## Anexo D — Referência rápida dos 6 endpoints

| Endpoint | Campos que usamos | Campos que ignoramos |
|---|---|---|
| `/pokemon/{id\|name}` | `id`, `name`, `height`, `weight`, `base_experience`, `types[].type.name`, `stats[].{base_stat,effort,stat.name}`, `abilities[].{is_hidden,ability.name}`, `sprites.front_default`, `sprites.other['official-artwork'].front_default`, `cries.latest`, `species.url` | `moves` (86 itens, ~80% do payload), `game_indices`, `held_items`, `forms`, `past_*` |
| `/pokemon-species/{id\|name}` | `flavor_text_entries`, `genera`, `generation.name`, `habitat`, `is_legendary`, `is_mythical`, `evolution_chain.url` | `pokedex_numbers`, `pal_park_encounters`, `egg_groups`, `varieties` |
| `/type/{name}` | `damage_relations.{double,half,no}_damage_from` | `pokemon` (156 itens), `moves`, `game_indices` |
| `/evolution-chain/{id}` | `chain` (recursivo): `species.name`, `evolution_details[].{trigger,min_level,item,min_happiness,time_of_day}`, `evolves_to` | `baby_trigger_item` |
| `/ability/{name}` | `name`, `effect_entries[language=en].short_effect` | `pokemon` (lista longa), `flavor_text_entries`, `effect_changes` |
| `/generation/{name}` | `name`, `main_region.name`, `pokemon_species[]` (para o filtro) | `moves`, `types`, `version_groups`, `abilities` |

**Listas auxiliares.** `GET /type?limit=100` → 21 itens (filtre para 18). `GET /generation` → 9.
`GET /pokemon?limit=1025&offset=0` → índice da Pokédex nacional, 93 KB.

---

*Fonte dos dados: PokéAPI v2 (`https://pokeapi.co/api/v2`), documentação e respostas reais
consultadas em 22 de setembro de 2026. A PokéAPI é gratuita e pede cache local — respeite a fair
use policy.*
