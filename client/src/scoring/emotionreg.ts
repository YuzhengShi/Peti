import { QuestionItem } from '../questions/types';
import {
  Band,
  ScoredResult,
  reverseScore,
  subscalePercent,
  toBand,
} from './utils';

/**
 * Adaptive subscales — higher score = more use of healthy strategy.
 * For the aggregate we invert these so the domain aggregate direction is
 * "higher = more regulation difficulty" (consistent with other domains).
 */
const ADAPTIVE_SUBSCALES = new Set([
  'awareness',
  'acceptance',
  'reappraisal',
  'problem-focused',
]);

/**
 * ERQ / process model: 12 items, 5-point.
 *
 * Each subscale is scored in its NATURAL direction:
 *   adaptive (awareness, acceptance, reappraisal, problem-focused): higher = more use
 *   maladaptive (suppression, rumination): higher = more use
 *
 * Aggregate: inverts adaptive subscale %s so higher aggregate = more difficulty.
 */
export function scoreEmotionReg(
  answers: Record<string, number>,
  items: QuestionItem[],
): ScoredResult {
  const scaleMax = 5;

  // Group items by subscale
  const subscaleItems: Record<string, QuestionItem[]> = {};
  for (const item of items) {
    (subscaleItems[item.subscale] ??= []).push(item);
  }

  const subscaleBands: Record<string, Band> = {};
  const aggregatePercents: number[] = [];

  for (const [subscale, subItems] of Object.entries(subscaleItems)) {
    let sum = 0;
    for (const item of subItems) {
      const raw = answers[item.id] ?? 1;
      sum += item.reverse ? reverseScore(raw, scaleMax) : raw;
    }
    const pct = subscalePercent(sum, subItems.length, scaleMax);

    // Subscale band: natural direction
    subscaleBands[subscale] = toBand(pct);

    // For aggregate: invert adaptive subscales so all point toward "difficulty"
    aggregatePercents.push(
      ADAPTIVE_SUBSCALES.has(subscale) ? 100 - pct : pct,
    );
  }

  const avgPercent =
    aggregatePercents.reduce((a, b) => a + b, 0) / aggregatePercents.length;

  return {
    subscales: subscaleBands,
    aggregate: toBand(avgPercent),
  };
}
