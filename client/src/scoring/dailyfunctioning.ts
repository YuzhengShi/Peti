import { QuestionItem } from '../questions/types';
import { ScoredResult, scoreDomain } from './utils';

/** WHODAS: 12 items, 5-point. Higher = more difficulty. */
export function scoreDailyFunctioning(
  answers: Record<string, number>,
  items: QuestionItem[],
): ScoredResult {
  return scoreDomain(answers, items, 5);
}
