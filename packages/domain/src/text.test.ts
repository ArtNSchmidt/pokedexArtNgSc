import { describe, expect, it } from 'vitest';
import {
  normalizeForSearch,
  sanitizeFlavorText,
  selectLocalizedText,
  toDisplayName,
} from './text.js';

describe('sanitizeFlavorText (Anexo C)', () => {
  it('remove \\n e \\f e colapsa espaços — valor literal de §2.3.5', () => {
    const raw =
      'A strange seed was\nplanted on its\nback at birth.\x0cThe plant sprouts\nand grows with\nthis POKéMON.';

    expect(sanitizeFlavorText(raw)).toBe(
      'A strange seed was planted on its back at birth. The plant sprouts and grows with this POKéMON.',
    );
  });

  it('null entra, null sai (não lança)', () => {
    expect(sanitizeFlavorText(null)).toBeNull();
  });

  it('texto só de espaço em branco vira null', () => {
    expect(sanitizeFlavorText(' \n\f ')).toBeNull();
  });
});

describe('toDisplayName', () => {
  it.each([
    ['mr-mime', 'Mr Mime'],
    ['nidoran-f', 'Nidoran F'],
    ['ho-oh', 'Ho Oh'],
    ['deoxys-normal', 'Deoxys Normal'],
    ['pikachu', 'Pikachu'],
    ['', ''],
  ])('%s → %s', (slug, expected) => {
    expect(toDisplayName(slug)).toBe(expected);
  });
});

describe('normalizeForSearch', () => {
  it.each([
    ['Mr. Mime', 'mr-mime'],
    ['mr mime', 'mr-mime'],
    ['MR-MIME', 'mr-mime'],
    ['Flabébé', 'flabebe'],
    ['  Pikachu  ', 'pikachu'],
    ['---', ''],
  ])('%s → %s', (value, expected) => {
    expect(normalizeForSearch(value)).toBe(expected);
  });
});

describe('selectLocalizedText', () => {
  const entries = [
    { language: 'ja', text: 'たね' },
    { language: 'en', text: 'old english' },
    { language: 'en', text: 'newest english' },
  ];

  it('pega a última entrada do primeiro idioma preferido disponível', () => {
    expect(selectLocalizedText(entries)).toBe('newest english');
  });

  it('prefere pt quando existir', () => {
    expect(selectLocalizedText([...entries, { language: 'pt', text: 'semente' }])).toBe('semente');
  });

  it('devolve null sem idioma preferido', () => {
    expect(selectLocalizedText([{ language: 'ja', text: 'たね' }])).toBeNull();
    expect(selectLocalizedText([])).toBeNull();
  });
});
