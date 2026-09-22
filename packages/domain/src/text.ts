const FORM_FEED = /\f/g;
const WHITESPACE_RUN = /\s+/g;
const DIACRITICS = /\p{Diacritic}/gu;
const APOSTROPHES = /['‘’ʼ`]/g;
const NON_ALPHANUMERIC_RUN = /[^a-z0-9]+/g;
const EDGE_HYPHENS = /^-+|-+$/g;
const HYPHEN = '-';
const SPACE = ' ';

/**
 * Anexo C. O `flavor_text` da PokéAPI vem com `\n` e `\f` (form feed) do jogo original. Troca o
 * form feed por espaço, colapsa qualquer sequência de espaço em branco e apara as pontas.
 * `null` entra, `null` sai; texto que vira vazio também sai `null` — a função não lança.
 */
export function sanitizeFlavorText(raw: string | null): string | null {
  if (raw === null) return null;
  const text = raw.replace(FORM_FEED, SPACE).replace(WHITESPACE_RUN, SPACE).trim();
  return text.length === 0 ? null : text;
}

/**
 * `mr-mime` → `Mr Mime`; `nidoran-f` → `Nidoran F`. Sem casos especiais (`ho-oh` vira `Ho Oh`):
 * consistência previsível vale mais que acerto pontual (Anexo C).
 */
export function toDisplayName(slug: string): string {
  return slug
    .split(HYPHEN)
    .filter((word) => word.length > 0)
    .map(capitalize)
    .join(SPACE);
}

function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

/**
 * Minúsculas → NFD → sem diacríticos → apóstrofo **some** → demais não-alfanuméricos viram `-` →
 * sem `-` nas pontas. `"Mr. Mime"`, `"mr mime"` e `"MR-MIME"` casam com o slug `mr-mime`;
 * `"Flabébé"` com `flabebe`. O apóstrofo é apagado, e não hifenizado, porque a PokéAPI também o
 * apaga: `Farfetch'd` é o slug `farfetchd` — hifenizar daria `farfetch-d` e a busca não acharia.
 */
export function normalizeForSearch(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(DIACRITICS, '')
    .replace(APOSTROPHES, '')
    .replace(NON_ALPHANUMERIC_RUN, HYPHEN)
    .replace(EDGE_HYPHENS, '');
}

export interface LocalizedText {
  readonly language: string;
  readonly text: string;
}

/** Preferência de idioma (Anexo C): `pt` se um dia existir, senão `en`. */
export const LANGUAGE_PREFERENCE: readonly string[] = ['pt', 'en'];

/**
 * Escolhe a **última** entrada do primeiro idioma disponível na ordem de preferência — a última é
 * a versão mais recente do jogo. Sem entrada em nenhum idioma preferido devolve `null`.
 */
export function selectLocalizedText(
  entries: readonly LocalizedText[],
  preference: readonly string[] = LANGUAGE_PREFERENCE,
): string | null {
  for (const language of preference) {
    const latest = entries.filter((entry) => entry.language === language).at(-1);
    if (latest !== undefined) return latest.text;
  }
  return null;
}
