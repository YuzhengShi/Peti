import { QuestionItem } from '../questions/types';
import { ScoredResult, scoreDomain } from './utils';

/**
 * Big Five (IPIP): 50 items, 5-point.
 * Each subscale: higher = more of that trait.
 * Aggregate: average of all 5 trait percentages.
 */
export function scoreBigFive(
  answers: Record<string, number>,
  items: QuestionItem[],
): ScoredResult {
  return scoreDomain(answers, items, 5);
}
