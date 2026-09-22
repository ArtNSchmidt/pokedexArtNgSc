# ADR-007 — Referência visual: Figma "Pokédex (Community)" e desvios de layout

**Status:** aceito · **Data:** 2026-09-22

## Contexto

O `AGENTS.md` define **o que** a UI faz (§1, §7.7, §7.8) mas não a aparência. O usuário forneceu
como referência visual o arquivo Figma "Pokédex (Community)" (Junior Saraiva): identidade
`#DC0A2D`, 18 cores de tipo, Poppins, elevações e as telas de lista e detalhe.

As quatro capturas do arquivo original estão em `docs/Screenshot 2026-09-22 10*.png` e cobrem, na
ordem: style guide (cores, tipografia, elevação), componentes e wireframes, telas da Pokédex e dos
Pokémon, e as páginas de inspeção do protótipo. Elas são a fonte dos tokens em
`apps/web/src/styles/tokens.css`.

## Alternativas descartadas

- **Seguir só o texto do `AGENTS.md`** (grade `minmax(150px, 1fr)`, fonte de sistema): perde a
  fidelidade à referência que o usuário pediu explicitamente.
- **Implementar também o "Sort by" do Figma:** exigiria emendar o contrato congelado (§6) por uma
  função que o produto não pede. Descartado com o usuário.

## Decisão

Funcionalidade e arquitetura vêm do `AGENTS.md`; aparência vem da Figma. Desvios de layout em
relação a §7.7, todos motivados pela referência:

| Item                    | `AGENTS.md`                      | Aplicado                                            | Por quê                                           |
| ----------------------- | -------------------------------- | --------------------------------------------------- | ------------------------------------------------- |
| Grade no celular        | `minmax(150px, 1fr)` (2 colunas) | `minmax(104px, 1fr)`, gap 8 (3 colunas)             | Figma mostra 3 cards de 104×108 em 360 px         |
| Fonte                   | de sistema                       | Poppins + fallback de sistema, `font-display: swap` | Tipografia da Figma; sem rede o layout não quebra |
| Tamanho mínimo de texto | —                                | 12 px (Figma usa 10 px / 8 px)                      | Legibilidade em web; hierarquia preservada        |
| Imagem do card          | `spriteUrl`                      | `artworkUrl` com fallback para `spriteUrl`          | Ver ADR-004                                       |
| Detalhe                 | —                                | chevrons anterior/próximo e botão de "cry"          | Presentes na Figma; `cryUrl` já está no contrato  |
| Popup "Sort by"         | —                                | vira o painel de **filtros** (tipo e geração)       | Mesma linguagem visual, função que o produto pede |

Seções que a Figma não tem (fraquezas, habilidades com efeito, evolução) usam a mesma linguagem:
título na cor do tipo, chips de tipo, texto `body`.

## Contraste: onde a Figma foi corrigida

A Figma usa texto branco sobre todas as 18 cores de tipo e a cor viva do tipo para os títulos de
seção sobre o card branco. Medido em WCAG, isso reprova em boa parte dos casos, então cada cor
ganhou dois companheiros em `tokens.css`:

| Token             | Uso                                     | Regra aplicada                                             |
| ----------------- | --------------------------------------- | ---------------------------------------------------------- |
| `--type-<x>`      | fundo do chip, fundo do detalhe, barra  | cor da Figma, intocada                                     |
| `--type-<x>-ink`  | texto **sobre** a cor do tipo           | branco só nos cinco fundos escuros (≥ 4,5:1); resto escuro |
| `--type-<x>-deep` | texto **sobre branco** (títulos, stats) | mesma matiz escurecida até ≥ 4,5:1                         |

Sem isso, um chip `electric` com texto branco fica em 1,5:1 e um título "Sobre" em `electric`
sobre o card branco também — ilegíveis. Fidelidade visual não justifica texto que não se lê.

## Consequências

- Cor de tipo é **token CSS** (`--type-fire`…), nunca `if` em componente.
- O alvo de toque de 44 px (§7.7) é mantido com área transparente ao redor do visual de 32 px,
  inclusive no campo de busca, que desenha 32 px e recebe toque em 44 px.
- Os textos da interface são em PT-BR; os textos vindos da PokéAPI ficam em inglês (§2.3.6).
