/** Canonical Big Five factor names in display order. */
export const BIG_FIVE_FACTORS = [
  'neuroticism',
  'extraversion',
  'openness',
  'agreeableness',
  'conscientiousness',
] as const;

export type BigFiveFactor = (typeof BIG_FIVE_FACTORS)[number];
