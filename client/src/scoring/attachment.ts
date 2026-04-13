import { QuestionItem } from '../questions/types';
import { ScoredResult, scoreDomain } from './utils';

/** ECR-R: 12 items, 7-point. Higher = more anxiety / avoidance. */
export function scoreAttachment(
  answers: Record<string, number>,
  items: QuestionItem[],
): ScoredResult {
  return scoreDomain(answers, items, 7);
}
