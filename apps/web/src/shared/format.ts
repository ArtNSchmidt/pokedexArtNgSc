/**
 * Formatação de apresentação em PT-BR. Não há regra de negócio aqui: os valores já chegam
 * calculados pelo BFF (metros, quilos, multiplicadores); isto só decide como mostrá-los.
 */
import { GENERATION_OPTIONS, type DamageMultiplier, type GenerationName } from '@pokedex/contracts';

const PT_BR_ONE_DECIMAL = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const POKEDEX_NUMBER_DIGITS = 3;
const STAT_DIGITS = 3;

/** `6` → `#006`, como nos cards da Figma. */
export function formatPokedexNumber(id: number): string {
  return `#${String(id).padStart(POKEDEX_NUMBER_DIGITS, '0')}`;
}

/** `0.7` → `0,7 m`. */
export function formatMeters(meters: number): string {
  return `${PT_BR_ONE_DECIMAL.format(meters)} m`;
}

/** `6.9` → `6,9 kg`. */
export function formatKilograms(kilograms: number): string {
  return `${PT_BR_ONE_DECIMAL.format(kilograms)} kg`;
}

/** `45` → `045`, alinhado como na tabela de stats da Figma. */
export function formatStatValue(value: number): string {
  return String(value).padStart(STAT_DIGITS, '0');
}

const MULTIPLIER_LABELS: Readonly<Record<DamageMultiplier, string>> = {
  4: '×4',
  2: '×2',
  0.5: '×½',
  0.25: '×¼',
  0: 'imune',
};

/** Rótulos de §7.8: `×4`, `×2`, `×½`, `×¼`, `imune`. */
export function formatMultiplier(multiplier: DamageMultiplier): string {
  return MULTIPLIER_LABELS[multiplier];
}

const EMPTY_PLACEHOLDER = '—';

/** `null` renderiza como travessão, nunca como "null" nem espaço em branco (§7.8). */
export function orPlaceholder(value: string | null): string {
  return value ?? EMPTY_PLACEHOLDER;
}

/**
 * `generation-iv` → `Geração IV`, lendo o rótulo publicado pelo contrato (ADR-004): derivar o
 * texto aqui criaria um segundo dicionário para o mesmo conceito, que o filtro e o detalhe
 * veriam divergir. O slug só aparece se o contrato ganhar uma geração sem rótulo.
 */
export function formatGeneration(name: GenerationName): string {
  return GENERATION_OPTIONS.find((option) => option.name === name)?.displayName ?? name;
}

/** Slugs da API (`level-up`, `water-stone`, `eterna-forest`) como texto legível. */
export function humanizeSlug(slug: string): string {
  return slug
    .split('-')
    .filter((word) => word.length > 0)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
