import { QuestionItem } from '../questions/types';
import { ScoredResult, scoreDomain } from './utils';

/** LPFS: 12 items, 5-point. Higher = better functioning. */
export function scoreFunctioning(
  answers: Record<string, number>,
  items: QuestionItem[],
): ScoredResult {
  return scoreDomain(answers, items, 5);
}
