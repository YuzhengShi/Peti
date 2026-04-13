import { DomainSection } from './types';

/**
 * Personality Functioning — 12 items, DSM-5 AMPD / LPFS-BF 2.0 framework
 * Timeframe: general patterns | Scale: 5-point agreement
 * Subscales: identity(3), self-direction(3), empathy(3), intimacy(3)
 * ALL items positively keyed (higher = better functioning)
 * No reverse-scored items
 */
export const functioning: DomainSection = {
  id: 'personalityFunctioning',
  title: 'How You See Yourself & Others',
  intro:
    "this one's about how you see yourself and relate to others. these " +
    "patterns can run deep, but they're not set in stone. no answer is " +
    "wrong — just go with what feels most true.",
  timeframe: 'General patterns',
  scale: {
    points: 5,
    labels: [
      'Strongly disagree',
      'Disagree',
      'Neither agree nor disagree',
      'Agree',
      'Strongly agree',
    ],
  },
  items: [
    // identity
    { id: 'pf01', text: 'I have a clear and stable sense of who I am.', subscale: 'identity', reverse: false },
    { id: 'pf02', text: 'My sense of self stays fairly consistent across different situations.', subscale: 'identity', reverse: false },
    { id: 'pf03', text: 'I have a realistic understanding of my strengths and limitations.', subscale: 'identity', reverse: false },
    // self-direction
    { id: 'pf04', text: 'I have meaningful goals that guide my decisions.', subscale: 'self-direction', reverse: false },
    { id: 'pf05', text: 'I can reflect on my behavior and learn from my experiences.', subscale: 'self-direction', reverse: false },
    { id: 'pf06', text: 'I have a sense of direction in my life.', subscale: 'self-direction', reverse: false },
    // empathy
    { id: 'pf07', text: "I can understand things from other people's perspectives.", subscale: 'empathy', reverse: false },
    { id: 'pf08', text: 'I recognize how my actions affect others.', subscale: 'empathy', reverse: false },
    { id: 'pf09', text: 'I can appreciate that others may experience situations differently than I do.', subscale: 'empathy', reverse: false },
    // intimacy
    { id: 'pf10', text: 'I can form close, meaningful connections with others.', subscale: 'intimacy', reverse: false },
    { id: 'pf11', text: 'My close relationships involve mutual care and understanding.', subscale: 'intimacy', reverse: false },
    { id: 'pf12', text: 'I can maintain closeness with others over time.', subscale: 'intimacy', reverse: false },
  ],
};
