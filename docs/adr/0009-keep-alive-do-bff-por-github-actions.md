# ADR-009 — Keep-alive do BFF por GitHub Actions a cada 10 minutos

**Status:** aceito · **Data:** 2026-09-22

## Contexto

O plano free do Render hiberna a instância após **15 minutos** sem tráfego (ADR-008). Quem abre a
Pokédex depois disso espera o spin-up — cerca de um minuto — antes do primeiro byte, e a tela fica
no skeleton o tempo todo. Numa apresentação acadêmica esse é o primeiro minuto que o avaliador vê.

O intervalo do ping não pode ser folgado: a documentação do GitHub avisa que execuções agendadas
**atrasam sob carga**, em especial no início de cada hora, e que em carga extrema jobs enfileirados
podem ser **descartados**. Um ping a cada 16 minutos chegaria sempre depois da hibernação — pagaria
o cold start em todo ciclo sem evitar nenhum.

## Alternativa descartada

**Serviço externo de uptime** (UptimeRobot, cron-job.org). Pinga de graça a cada 5 min e não gasta
cota nenhuma do GitHub. Foi descartado por um motivo de disciplina, não técnico: o agendamento
viveria fora do repositório, sem versionamento, sem revisão e invisível para quem clona o projeto.
Continua sendo a saída certa se a cota do Actions virar um problema.

## Decisão

`.github/workflows/keepalive.yml` faz `GET /api/v1/health` nos minutos 3, 13, 23, 33, 43 e 53 de
cada hora — intervalos uniformes de 10 min, com 5 de folga sobre o limite de 15 para absorver o
atraso da fila. O deslocamento de 3 minutos evita o pico do início da hora, como a própria
documentação do GitHub recomenda.

Três escolhas merecem registro:

- **Mira o Render direto, não o domínio da Vercel.** Um GET atrás do rewrite poderia ser servido
  pelo cache da edge sem jamais tocar a instância — exatamente o que o keep-alive existe para
  evitar. `/health` é também a única rota que o BFF isenta de `cache-control` (`server.ts`).
- **Sem `actions/checkout` e com `permissions: {}`.** O job não lê nem escreve no repositório;
  negar todos os escopos do `GITHUB_TOKEN` é o menor privilégio, e pular o checkout economiza cota.
- **`concurrency` com `cancel-in-progress`.** Se a fila atrasar e empilhar execuções, só a mais
  recente interessa: o ping não é acumulativo.

## Consequências

- São **4.320 execuções por mês**. Minutos de Actions são faturados apenas em repositórios
  privados, e **arredondados para cima a cada job** — um ping de 3 s custaria 1 min cheio, 216% da
  cota de 2.000 min/mês do plano Free. Por isso este repositório é **público**, onde runners
  hospedados pelo GitHub são gratuitos e ilimitados.
- **CUIDADO:** em repositório público, workflows agendados são desativados automaticamente após
  **60 dias sem atividade** no repositório. Um push qualquer religa.
- O keep-alive consome o teto de **750 h de instância free por workspace/mês** do Render: 24/7 são
  ~720 h, 96% do orçamento. Se outro serviço free do mesmo workspace passar a ficar acordado, o
  teto estoura e **todos** são suspensos até o mês virar. Nesse caso, reduza a janela do cron para
  horário comercial em vez de 24/7.
