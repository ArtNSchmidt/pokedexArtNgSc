# ADR-001 — O backend é um BFF, não um proxy

**Status:** aceito · **Data:** 2026-09-22

## Contexto

A PokéAPI devolve `/pokemon/1` com 272 KB, dos quais ~80 % são os 86 itens de `moves`, que a
Pokédex não usa. Uma grade de 24 cards renderizada com chamadas diretas do navegador custaria
~6,5 MB ao celular do usuário, e o React ficaria acoplado ao formato de um terceiro.

## Alternativa descartada

**Proxy transparente** (repassar o JSON da PokéAPI). Barato de escrever, caro de consumir: empurra
o payload e a normalização de dados para o cliente, e qualquer mudança no upstream quebra a UI.

## Decisão

O `apps/api` é um **Backend for Frontend**: agrega os 6 endpoints da PokéAPI, projeta apenas os
campos necessários e devolve um modelo estável (`packages/contracts`). O navegador nunca fala com
`pokeapi.co`.

## Consequências

- A grade de 24 cards passa a custar ~4 KB.
- O contrato interno (§6 do `AGENTS.md`) é o único acoplamento entre frontend e backend.
- Todo campo novo exige passar pelo mapper do BFF, o que é intencional: força a decisão consciente
  do que a UI realmente precisa.
