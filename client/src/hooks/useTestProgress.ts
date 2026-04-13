import { useState, useEffect, useCallback } from 'react';
import { domainSections } from '../questions';
import type { DimensionType, DomainSection } from '../questions/types';
import type { ScoredResult } from '../scoring/utils';
import { submitProfile, getProfiles, ProfileResult } from '../api/profiles';
import { apiFetch } from '../api/fetch';

// Domain scorers — mapped by DimensionType
import { scoreDailyFunctioning } from '../scoring/dailyfunctioning';
import { scoreSleep } from '../scoring/sleep';
import { scoreEmotionReg } from '../scoring/emotionreg';
import { scoreAttachment } from '../scoring/attachment';
import { scoreFunctioning } from '../scoring/functioning';
import { scoreBigFive } from '../scoring/scoring';

const STORAGE_KEY = 'peti-test-progress';

const SCORERS: Record<DimensionType, (answers: Record<string, number>, items: import('../questions/types').QuestionItem[]) => ScoredResult> = {
  dailyFunctioning: scoreDailyFunctioning,
  sleepRegulation: scoreSleep,
  emotionRegulation: scoreEmotionReg,
  attachment: scoreAttachment,
  personalityFunctioning: scoreFunctioning,
  bigFive: scoreBigFive,
};

interface UseTestProgressReturn {
  /** Current domain section to render. */
  currentSection: DomainSection | null;
  /** Index of current domain in the 6-domain sequence (0-5). */
  currentDomainIndex: number;
  /** Total domains (6). */
  totalDomains: number;
  /** Saved answers for the current domain. */
  answers: Record<string, number>;
  /** All answers keyed by DimensionType (for progress bar per-section counts). */
  answersByDomain: Record<string, Record<string, number>>;
  /** Domains already completed (have ProfileResult in DB). */
  completedDomains: Set<DimensionType>;
  /** Whether initial loading (fetching completed profiles) is in progress. */
  loading: boolean;
  /** Whether all 6 domains are complete. */
  allComplete: boolean;
  /** Record an answer for a question (auto-saves to localStorage). */
  setAnswer: (itemId: string, value: number) => void;
  /** Submit current domain — scores, POSTs to /api/profiles, returns to first incomplete domain. */
  submitDomain: () => Promise<void>;
  /** Trigger onboarding after all 6 domains — POST /api/onboarding. */
  triggerOnboarding: () => Promise<void>;
  /** Jump to any domain by index (preserves all answers). */
  jumpToDomain: (index: number) => void;
}

/**
 * Manages personality test progress: auto-save to localStorage per question,
 * score + POST on domain complete, resume from where the user left off.
 * Answers are stored per-domain and preserved across section jumps.
 */
export function useTestProgress(): UseTestProgressReturn {
  const [completedDomains, setCompletedDomains] = useState<Set<DimensionType>>(new Set());
  const [currentDomainIndex, setCurrentDomainIndex] = useState(0);
  const [answersByDomain, setAnswersByDomain] = useState<Record<string, Record<string, number>>>({});
  const [loading, setLoading] = useState(true);

  // On mount: check which domains are already done (DB), and resume from localStorage
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const profiles = await getProfiles();
        if (cancelled) return;

        const done = new Set<DimensionType>(profiles.map((p: ProfileResult) => p.dimensionType));
        setCompletedDomains(done);

        // Find first incomplete domain
        const firstIncomplete = domainSections.findIndex(s => !done.has(s.id));
        const startIdx = firstIncomplete === -1 ? domainSections.length : firstIncomplete;
        setCurrentDomainIndex(startIdx);

        // Restore all answers from localStorage
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (typeof parsed === 'object' && parsed !== null) {
              // Handle old format { currentDomain, answers } → migrate
              if ('currentDomain' in parsed && 'answers' in parsed) {
                setAnswersByDomain({ [parsed.currentDomain]: parsed.answers });
              } else {
                setAnswersByDomain(parsed);
              }
            }
          } catch { /* corrupt localStorage, start fresh */ }
        }
      } catch {
        // If profiles fetch fails, start from beginning
        setCurrentDomainIndex(0);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const currentSection = currentDomainIndex < domainSections.length
    ? domainSections[currentDomainIndex]
    : null;

  const allComplete = completedDomains.size >= domainSections.length;

  // Derived: answers for the current domain
  const answers = currentSection ? (answersByDomain[currentSection.id] || {}) : {};

  // Save answer + persist all answers to localStorage
  const setAnswer = useCallback((itemId: string, value: number) => {
    if (!currentSection) return;
    setAnswersByDomain(prev => {
      const domainAnswers = { ...(prev[currentSection.id] || {}), [itemId]: value };
      const next = { ...prev, [currentSection.id]: domainAnswers };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, [currentSection]);

  // Score current domain, POST result, return to first incomplete domain
  const submitDomain = useCallback(async () => {
    if (!currentSection) return;

    const domainAnswers = answersByDomain[currentSection.id] || {};
    const scorer = SCORERS[currentSection.id];
    const scored = scorer(domainAnswers, currentSection.items);
    await submitProfile(currentSection.id, scored);

    // Update completed set and jump to first still-incomplete domain
    const newCompleted = new Set([...completedDomains, currentSection.id]);
    setCompletedDomains(newCompleted);
    const firstIncomplete = domainSections.findIndex(s => !newCompleted.has(s.id));
    setCurrentDomainIndex(firstIncomplete === -1 ? domainSections.length : firstIncomplete);
  }, [currentSection, answersByDomain, completedDomains]);

  // Jump to any domain — preserves all answers
  const jumpToDomain = useCallback((index: number) => {
    setCurrentDomainIndex(index);
  }, []);

  // POST /api/onboarding after all 6 domains + clean up localStorage
  const triggerOnboarding = useCallback(async () => {
    await apiFetch<{ message: string }>('/api/onboarding', { method: 'POST' });
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    currentSection,
    currentDomainIndex,
    totalDomains: domainSections.length,
    answers,
    answersByDomain,
    completedDomains,
    loading,
    allComplete,
    setAnswer,
    submitDomain,
    triggerOnboarding,
    jumpToDomain,
  };
}
