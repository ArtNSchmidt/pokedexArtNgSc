type ClassValue = string | false | null | undefined;

/** Junta classes ignorando valores falsos: `cx(styles.card, isActive && styles.active)`. */
export function cx(...classes: readonly ClassValue[]): string {
  return classes
    .filter((value): value is string => typeof value === 'string' && value.length > 0)
    .join(' ');
}
