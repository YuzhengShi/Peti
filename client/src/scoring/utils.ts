import { QuestionItem } from '../questions/types';

export type Band = 'lower' | 'moderate' | 'higher';

export interface ScoredResult {
  subscales: Record<string, Band>;
  aggregate: Band;
}

/** Convert percentage (0-100) to descriptive band. */
export function toBand(percent: number): Band {
  if (percent <= 33) return 'lower';
  if (percent <= 67) return 'moderate';
  return 'higher';
}

/** Reverse a single response: (scaleMax + 1) - raw */
export function reverseScore(value: number, scaleMax: number): number {
  return scaleMax + 1 - value;
}

/**
 * Compute percentage of max for a subscale sum.
 * scaleMin is always 1 (lowest Likert response).
 */
export function subscalePercent(
  sum: number,
  itemCount: number,
  scaleMax: number,
): number {
  const minPossible = itemCount * 1;
  const maxPossible = itemCount * scaleMax;
  if (maxPossible === minPossible) return 0;
  return ((sum - minPossible) / (maxPossible - minPossible)) * 100;
}

/**
 * Generic domain scorer.
 * Works for domains where ALL subscales point in the same direction.
 * For mixed-direction domains (emotion regulation), use a custom scorer.
 */
export function scoreDomain(
  answers: Record<string, number>,
  items: QuestionItem[],
  scaleMax: number,
): ScoredResult {
  // Group items by subscale
  const subscaleItems: Record<string, QuestionItem[]> = {};
  for (const item of items) {
    (subscaleItems[item.subscale] ??= []).push(item);
  }

  const subscaleBands: Record<string, Band> = {};
  const subscalePercents: number[] = [];

  for (const [subscale, subItems] of Object.entries(subscaleItems)) {
    let sum = 0;
    for (const item of subItems) {
      const raw = answers[item.id] ?? 1;
      sum += item.reverse ? reverseScore(raw, scaleMax) : raw;
    }
    const pct = subscalePercent(sum, subItems.length, scaleMax);
    subscaleBands[subscale] = toBand(pct);
    subscalePercents.push(pct);
  }

  const avgPercent =
    subscalePercents.reduce((a, b) => a + b, 0) / subscalePercents.length;

  return {
    subscales: subscaleBands,
    aggregate: toBand(avgPercent),
  };
}
