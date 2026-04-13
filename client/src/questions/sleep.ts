import { DomainSection } from './types';

/**
 * Sleep-Wake Regulation — 8 items, PROMIS Sleep Disturbance framework
 * Timeframe: past 7 days | Scale: 5-point frequency (Not at all → Very much)
 * Subscales: quality(3), continuity(3), daytime-impact(2)
 * Items 2-3 reverse-scored (positive sleep statements)
 */
export const sleep: DomainSection = {
  id: 'sleepRegulation',
  title: 'Sleep & Rest',
  intro:
    "now let's talk about sleep. no judgment here — sleep is tricky for " +
    "most people. just think about how the past week has actually been, " +
    "not how you think it should be.",
  timeframe: 'In the past 7 days',
  scale: {
    points: 5,
    labels: ['Not at all', 'A little bit', 'Somewhat', 'Quite a bit', 'Very much'],
  },
  items: [
    // quality
    { id: 'sl01', text: 'My sleep quality was poor.', subscale: 'quality', reverse: false },
    { id: 'sl02', text: 'My sleep was refreshing.', subscale: 'quality', reverse: true },
    { id: 'sl03', text: 'I was satisfied with my sleep.', subscale: 'quality', reverse: true },
    // continuity
    { id: 'sl04', text: 'I had difficulty falling asleep.', subscale: 'continuity', reverse: false },
    { id: 'sl05', text: 'I had trouble staying asleep.', subscale: 'continuity', reverse: false },
    { id: 'sl06', text: 'My sleep felt restless or interrupted.', subscale: 'continuity', reverse: false },
    // daytime-impact
    { id: 'sl07', text: 'I felt tired or fatigued during the day.', subscale: 'daytime-impact', reverse: false },
    { id: 'sl08', text: 'Fatigue interfered with my daily activities.', subscale: 'daytime-impact', reverse: false },
  ],
};
