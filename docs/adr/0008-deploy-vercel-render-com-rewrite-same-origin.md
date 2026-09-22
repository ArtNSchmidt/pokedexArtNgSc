# ADR-008 — Front na Vercel e BFF no Render, unidos por rewrite same-origin

**Status:** aceito · **Data:** 2026-09-22

## Contexto

O front foi publicado na Vercel (`pokedex-art-ng-sc-web.vercel.app`) e o BFF no Render
(`pokedexartngsc.onrender.com`). O cliente HTTP sempre falou com um caminho **relativo**
(`API_BASE_PATH = '/api/v1'`), porque em desenvolvimento o proxy do Vite cobre `/api`
(`apps/web/vite.config.ts`). Em produção não havia nada cobrindo esse caminho: a Vercel servia o
bundle e devolvia `404 NOT_FOUND` para `GET /api/v1/pokemon`. Pela mesma ausência de regra, abrir
`/pokemon/1` direto (ou recarregar a página) também dava `404` — a Vercel procurava um arquivo com
esse nome em vez de entregar o `index.html` ao React Router.

## Alternativa descartada

**Apontar o front direto ao Render via `VITE_API_BASE_URL`.** Funcionaria — o CORS do Fastify já
aceita qualquer origem (`server.ts`) —, mas tem três custos: o browser passa a fazer preflight em
cada requisição cross-origin, a URL do backend fica gravada no bundle (trocar de host exige rebuild
do front) e o `index.html` continuaria sem fallback, deixando o `404` das rotas de detalhe de pé.
O rewrite resolve os dois problemas com um arquivo só e mantém o cliente ignorante de onde o BFF
mora — a fronteira que o ADR-001 estabeleceu.

## Decisão

`apps/web/vercel.json` declara dois rewrites, nesta ordem:

1. `/api/:path*` → `https://pokedexartngsc.onrender.com/api/:path*` — a Edge Network da Vercel
   encaminha ao Render e devolve a resposta sob o domínio do front. Para o browser é same-origin.
2. `/(.*)` → `/index.html` — fallback de SPA. Os rewrites só são avaliados **depois** da busca no
   filesystem, então `/assets/*` e `/favicon.svg` continuam sendo servidos como arquivos.

A URL do Render é literal no `vercel.json` por ser a única coisa que a Vercel precisa saber e por
ser pública de qualquer forma. Trocar de backend é editar uma linha, sem rebuild do bundle.

## Consequências

- O `Root Directory` do projeto na Vercel é `apps/web`; o `vercel.json` precisa ficar **lá**, não na
  raiz do monorepo, senão é ignorado.
- **CUIDADO:** o plano free do Render hiberna o serviço após ~15 min sem tráfego. O primeiro acesso
  depois disso espera o cold start (dezenas de segundos) _mais_ o carregamento do índice (ADR-003).
  A tela mostra o skeleton nesse intervalo; não é erro, é o plano.
- O BFF continua mandando `cache-control: public, max-age=300` nas leituras (§7.6); a resposta
  atravessa o rewrite intacta e o TanStack Query cacheia no cliente.
