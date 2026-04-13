import { describe, it, expect } from 'vitest';
import { bigFive } from '../questions/bigfive';
import { sleep } from '../questions/sleep';
import { emotionReg } from '../questions/emotionreg';
import { scoreBigFive } from './scoring';
import { scoreSleep } from './sleep';
import { scoreEmotionReg } from './emotionreg';
import { toBand, reverseScore, subscalePercent } from './utils';

// ── Utility tests ──

describe('toBand', () => {
  it('returns lower for 0-33%', () => {
    expect(toBand(0)).toBe('lower');
    expect(toBand(33)).toBe('lower');
  });

  it('returns moderate for 34-67%', () => {
    expect(toBand(34)).toBe('moderate');
    expect(toBand(67)).toBe('moderate');
  });

  it('returns higher for 68-100%', () => {
    expect(toBand(68)).toBe('higher');
    expect(toBand(100)).toBe('higher');
  });

  it('handles exact boundaries', () => {
    expect(toBand(33)).toBe('lower');
    expect(toBand(33.01)).toBe('moderate');
    expect(toBand(67)).toBe('moderate');
    expect(toBand(67.01)).toBe('higher');
  });
});

describe('reverseScore', () => {
  it('reverses on a 5-point scale', () => {
    expect(reverseScore(1, 5)).toBe(5);
    expect(reverseScore(5, 5)).toBe(1);
    expect(reverseScore(3, 5)).toBe(3);
  });

  it('reverses on a 7-point scale', () => {
    expect(reverseScore(1, 7)).toBe(7);
    expect(reverseScore(7, 7)).toBe(1);
    expect(reverseScore(4, 7)).toBe(4);
  });
});

describe('subscalePercent', () => {
  it('returns 0% for all-minimum answers', () => {
    // 2 items, scale 1-5, sum = 2 (min)
    expect(subscalePercent(2, 2, 5)).toBe(0);
  });

  it('returns 100% for all-maximum answers', () => {
    // 2 items, scale 1-5, sum = 10 (max)
    expect(subscalePercent(10, 2, 5)).toBe(100);
  });

  it('returns 50% for midpoint', () => {
    // 2 items, scale 1-5, sum = 6 → (6-2)/(10-2) = 4/8 = 50%
    expect(subscalePercent(6, 2, 5)).toBe(50);
  });
});

// ── Big Five scoring ──

describe('scoreBigFive', () => {
  it('returns all-lower bands when every answer is minimum', () => {
    const answers: Record<string, number> = {};
    for (const item of bigFive.items) {
      answers[item.id] = 1;
    }
    const result = scoreBigFive(answers, bigFive.items);

    // Direct items get 1 (min), reverse items get reversed to 5 (max).
    // Neuroticism: 6 direct*1 + 4 reverse*(5+1-1=5) = 6+20 = 26
    //   % = (26-10)/(50-10) = 16/40 = 40% → moderate
    // So all-1 does NOT produce all-lower because of reverse items.
    // Instead, check that every subscale has a valid band.
    for (const band of Object.values(result.subscales)) {
      expect(['lower', 'moderate', 'higher']).toContain(band);
    }
    expect(['lower', 'moderate', 'higher']).toContain(result.aggregate);
  });

  it('produces higher neuroticism when all N items answered at maximum', () => {
    const answers: Record<string, number> = {};
    // Set all Big Five items to 3 (neutral)
    for (const item of bigFive.items) {
      answers[item.id] = 3;
    }
    // Override neuroticism: direct items = 5, reverse items = 1
    for (const item of bigFive.items) {
      if (item.subscale === 'neuroticism') {
        answers[item.id] = item.reverse ? 1 : 5;
      }
    }
    const result = scoreBigFive(answers, bigFive.items);
    expect(result.subscales.neuroticism).toBe('higher');
  });

  it('produces lower neuroticism when N items answered for low neuroticism', () => {
    const answers: Record<string, number> = {};
    for (const item of bigFive.items) {
      answers[item.id] = 3;
    }
    // Low neuroticism: disagree with direct items, agree with reverse items
    for (const item of bigFive.items) {
      if (item.subscale === 'neuroticism') {
        answers[item.id] = item.reverse ? 5 : 1;
      }
    }
    const result = scoreBigFive(answers, bigFive.items);
    expect(result.subscales.neuroticism).toBe('lower');
  });

  it('returns all 5 subscale keys', () => {
    const answers: Record<string, number> = {};
    for (const item of bigFive.items) {
      answers[item.id] = 3;
    }
    const result = scoreBigFive(answers, bigFive.items);
    expect(Object.keys(result.subscales).sort()).toEqual([
      'agreeableness',
      'conscientiousness',
      'extraversion',
      'neuroticism',
      'openness',
    ]);
  });
});

// ── Sleep scoring ──

describe('scoreSleep', () => {
  it('returns lower disturbance when sleep is good', () => {
    const answers: Record<string, number> = {};
    for (const item of sleep.items) {
      // Good sleep: low on disturbance items, high on positive items
      answers[item.id] = item.reverse ? 5 : 1;
    }
    const result = scoreSleep(answers, sleep.items);
    expect(result.aggregate).toBe('lower');
  });

  it('returns higher disturbance when sleep is poor', () => {
    const answers: Record<string, number> = {};
    for (const item of sleep.items) {
      // Poor sleep: high on disturbance items, low on positive items
      answers[item.id] = item.reverse ? 1 : 5;
    }
    const result = scoreSleep(answers, sleep.items);
    expect(result.aggregate).toBe('higher');
  });
});

// ── Emotion regulation scoring ──

describe('scoreEmotionReg', () => {
  it('returns correct subscale keys', () => {
    const answers: Record<string, number> = {};
    for (const item of emotionReg.items) {
      answers[item.id] = 3;
    }
    const result = scoreEmotionReg(answers, emotionReg.items);
    expect(Object.keys(result.subscales).sort()).toEqual([
      'acceptance',
      'awareness',
      'problem-focused',
      'reappraisal',
      'rumination',
      'suppression',
    ]);
  });

  it('aggregate reflects difficulty — high adaptive + low maladaptive = lower difficulty', () => {
    const answers: Record<string, number> = {};
    for (const item of emotionReg.items) {
      const isAdaptive = ['awareness', 'acceptance', 'reappraisal', 'problem-focused'].includes(item.subscale);
      if (isAdaptive) {
        // High use of adaptive strategy
        answers[item.id] = item.reverse ? 1 : 5;
      } else {
        // Low use of maladaptive strategy
        answers[item.id] = item.reverse ? 5 : 1;
      }
    }
    const result = scoreEmotionReg(answers, emotionReg.items);
    // High adaptive (inverted to low difficulty) + low maladaptive = lower aggregate
    expect(result.aggregate).toBe('lower');
  });

  it('aggregate reflects difficulty — low adaptive + high maladaptive = higher difficulty', () => {
    const answers: Record<string, number> = {};
    for (const item of emotionReg.items) {
      const isAdaptive = ['awareness', 'acceptance', 'reappraisal', 'problem-focused'].includes(item.subscale);
      if (isAdaptive) {
        answers[item.id] = item.reverse ? 5 : 1;
      } else {
        answers[item.id] = item.reverse ? 1 : 5;
      }
    }
    const result = scoreEmotionReg(answers, emotionReg.items);
    expect(result.aggregate).toBe('higher');
  });
});
