import { describe, expect, it } from 'vitest';
import { searchByName } from './search.js';
import { normalizeForSearch } from './text.js';

const entry = (name: string) => ({ name, normalizedName: normalizeForSearch(name) });
const index = [
  entry('bulbasaur'),
  entry('pikachu'),
  entry('mr-mime'),
  entry('mime-jr'),
  entry('raichu'),
  entry('pichu'),
  entry('spinda'),
];

describe('searchByName (ADR-003, Anexo B)', () => {
  it('os que começam com o termo vêm antes dos que apenas o contêm', () => {
    expect(searchByName(index, 'pi').map((item) => item.name)).toEqual([
      'pikachu',
      'pichu',
      'spinda',
    ]);
  });

  it('é indiferente a acento, caixa e pontuação', () => {
    expect(searchByName(index, 'Mr. Mime').map((item) => item.name)).toEqual(['mr-mime']);
    expect(searchByName(index, 'MIME').map((item) => item.name)).toEqual(['mime-jr', 'mr-mime']);
  });

  it('termo vazio (ou só pontuação) devolve tudo, em cópia', () => {
    expect(searchByName(index, '')).toEqual(index);
    expect(searchByName(index, '  .  ')).toEqual(index);
    expect(searchByName(index, '')).not.toBe(index);
  });

  it('sem correspondência devolve lista vazia', () => {
    expect(searchByName(index, 'missingno')).toEqual([]);
  });
});
