const TENTHS = 10;

/** A PokéAPI mede altura em decímetros: Bulbasaur `height: 7` é 0,7 m (Anexo C). */
export function decimetersToMeters(decimeters: number): number {
  return Math.round(decimeters) / TENTHS;
}

/** A PokéAPI mede peso em hectogramas: Bulbasaur `weight: 69` é 6,9 kg (Anexo C). */
export function hectogramsToKilograms(hectograms: number): number {
  return Math.round(hectograms) / TENTHS;
}
