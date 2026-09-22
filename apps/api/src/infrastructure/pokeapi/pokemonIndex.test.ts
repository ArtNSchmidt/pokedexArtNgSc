import { describe, expect, it } from 'vitest';
import { FakeJsonHttpClient } from './__fixtures__/fakeJsonHttpClient.js';
import { POKEMON_INDEX_PATH, PokemonIndex } from './pokemonIndex.js';

describe('PokemonIndex (ADR-003)', () => {
  it('carrega o índice real e fica só com a Pokédex nacional (1.025 de 1.351)', async () => {
    const client = new FakeJsonHttpClient();
    const index = new PokemonIndex(client);

    await index.ensureLoaded();

    expect(index.size()).toBe(1025);
    expect(index.all()[0]).toEqual({ id: 1, name: 'bulbasaur', normalizedName: 'bulbasaur' });
    expect(index.all().at(-1)?.id).toBe(1025);
  });

  it('chamadas concorrentes e repetidas carregam uma única vez', async () => {
    const client = new FakeJsonHttpClient();
    const index = new PokemonIndex(client);

    await Promise.all([index.ensureLoaded(), index.ensureLoaded()]);
    await index.ensureLoaded();

    expect(client.callsTo(POKEMON_INDEX_PATH)).toBe(1);
  });

  it('busca sem acento e sem caixa, "começa com" antes de "contém"', async () => {
    const index = new PokemonIndex(new FakeJsonHttpClient());
    await index.ensureLoaded();

    expect(index.search('Mr. Mime')[0]?.name).toBe('mr-mime');
    expect(index.search('Flabébé').map((entry) => entry.name)).toEqual(['flabebe']);
    expect(index.search('chu').map((entry) => entry.name)).toEqual([
      'pikachu',
      'raichu',
      'pichu',
      'smoochum',
    ]);
  });

  it('tamanho é zero antes de carregar', () => {
    expect(new PokemonIndex(new FakeJsonHttpClient()).size()).toBe(0);
  });
});
