import { z } from 'zod';

/** As 9 gerações da PokéAPI, no formato do upstream (`generation-i` … `generation-ix`). */
export const GENERATION_NAMES = [
  'generation-i',
  'generation-ii',
  'generation-iii',
  'generation-iv',
  'generation-v',
  'generation-vi',
  'generation-vii',
  'generation-viii',
  'generation-ix',
] as const;

export const generationNameSchema = z.enum(GENERATION_NAMES);
export type GenerationName = z.infer<typeof generationNameSchema>;

export const generationOptionSchema = z.object({
  name: generationNameSchema,
  displayName: z.string().min(1),
  region: z.string().min(1),
});
export type GenerationOption = z.infer<typeof generationOptionSchema>;

/** Rótulo e região principal de cada geração, prontos para o filtro (`GET /generations`). */
export const GENERATION_OPTIONS: readonly GenerationOption[] = [
  { name: 'generation-i', displayName: 'Geração I', region: 'Kanto' },
  { name: 'generation-ii', displayName: 'Geração II', region: 'Johto' },
  { name: 'generation-iii', displayName: 'Geração III', region: 'Hoenn' },
  { name: 'generation-iv', displayName: 'Geração IV', region: 'Sinnoh' },
  { name: 'generation-v', displayName: 'Geração V', region: 'Unova' },
  { name: 'generation-vi', displayName: 'Geração VI', region: 'Kalos' },
  { name: 'generation-vii', displayName: 'Geração VII', region: 'Alola' },
  { name: 'generation-viii', displayName: 'Geração VIII', region: 'Galar' },
  { name: 'generation-ix', displayName: 'Geração IX', region: 'Paldea' },
];
