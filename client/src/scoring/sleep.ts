import { QuestionItem } from '../questions/types';
import { ScoredResult, scoreDomain } from './utils';

/** PROMIS Sleep: 8 items, 5-point. Higher = more disturbance. */
export function scoreSleep(
  answers: Record<string, number>,
  items: QuestionItem[],
): ScoredResult {
  return scoreDomain(answers, items, 5);
}
