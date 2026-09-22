import { describe, expect, it } from 'vitest';
import { decimetersToMeters, hectogramsToKilograms } from './units.js';

describe('unidades (Anexo C)', () => {
  it.each([
    [7, 0.7],
    [17, 1.7],
    [3, 0.3],
    [0, 0],
  ])('decimetersToMeters(%i) → %s', (decimeters, meters) => {
    expect(decimetersToMeters(decimeters)).toBe(meters);
  });

  it.each([
    [69, 6.9],
    [905, 90.5],
    [41, 4.1],
    [0, 0],
  ])('hectogramsToKilograms(%i) → %s', (hectograms, kilograms) => {
    expect(hectogramsToKilograms(hectograms)).toBe(kilograms);
  });
});
