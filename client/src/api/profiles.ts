import { apiFetch } from './fetch';
import type { DimensionType } from '../questions/types';
import type { ScoredResult } from '../scoring/utils';

export interface ProfileResult {
  id: string;
  userId: string;
  dimensionType: DimensionType;
  scores: ScoredResult;
  previousScores: ScoredResult | null;
  feedback: string | null;
  isStable: boolean;
  createdAt: string;
  updatedAt: string;
}

const STABLE_DIMENSIONS: Set<DimensionType> = new Set([
  'bigFive',
  'attachment',
  'personalityFunctioning',
]);

export function submitProfile(dimensionType: DimensionType, scores: ScoredResult) {
  return apiFetch<ProfileResult>('/api/profiles', {
    method: 'POST',
    body: JSON.stringify({
      dimensionType,
      scores,
      isStable: STABLE_DIMENSIONS.has(dimensionType),
    }),
  });
}

export function getProfiles() {
  return apiFetch<ProfileResult[]>('/api/profiles');
}
