import { DomainSection } from './types';

/**
 * Emotion Regulation Patterns — 12 items, ERQ / process model framework
 * Timeframe: past 2 weeks | Scale: 5-point frequency (Not at all → Very much)
 * Subscales: awareness(2), acceptance(2), reappraisal(2), problem-focused(2),
 *            suppression(2), rumination(2)
 * Item 4 reverse-scored (pushing away = opposite of acceptance)
 * Subscale direction: each measures its named construct directly
 *   adaptive (awareness, acceptance, reappraisal, problem-focused): higher = more use
 *   maladaptive (suppression, rumination): higher = more use
 */
export const emotionReg: DomainSection = {
  id: 'emotionRegulation',
  title: 'Emotion Regulation',
  intro:
    "this part is about how you've been handling your feelings lately. " +
    "there's no single right way — everyone has their own patterns, and " +
    "they can change. just think about the past couple of weeks.",
  timeframe: 'In the past 2 weeks',
  scale: {
    points: 5,
    labels: ['Not at all', 'A little bit', 'Somewhat', 'Quite a bit', 'Very much'],
  },
  items: [
    // awareness
    { id: 'er01', text: 'I noticed when my emotions were starting to shift.', subscale: 'awareness', reverse: false },
    { id: 'er02', text: 'I could identify what I was feeling with some clarity.', subscale: 'awareness', reverse: false },
    // acceptance
    { id: 'er03', text: 'I allowed myself to feel emotions without judging them as bad or wrong.', subscale: 'acceptance', reverse: false },
    { id: 'er04', text: 'I tried to push uncomfortable feelings away.', subscale: 'acceptance', reverse: true },
    // reappraisal
    { id: 'er05', text: 'I changed how I was thinking about a situation to feel differently about it.', subscale: 'reappraisal', reverse: false },
    { id: 'er06', text: 'I looked at situations from a different perspective when emotions felt intense.', subscale: 'reappraisal', reverse: false },
    // problem-focused
    { id: 'er07', text: 'I took action to address what was causing my emotions.', subscale: 'problem-focused', reverse: false },
    { id: 'er08', text: 'When something bothered me, I worked on changing the situation.', subscale: 'problem-focused', reverse: false },
    // suppression
    { id: 'er09', text: 'I kept my emotions to myself even when I wanted to express them.', subscale: 'suppression', reverse: false },
    { id: 'er10', text: 'I controlled my emotions by not showing them.', subscale: 'suppression', reverse: false },
    // rumination
    { id: 'er11', text: 'I kept thinking about how bad I felt.', subscale: 'rumination', reverse: false },
    { id: 'er12', text: 'I had trouble letting go of negative thoughts.', subscale: 'rumination', reverse: false },
  ],
};
