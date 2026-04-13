import { DomainSection } from './types';

/**
 * Relationship / Attachment Patterns — 12 items, ECR-R framework
 * Timeframe: general patterns | Scale: 7-point agreement
 * Subscales: anxiety(6), avoidance(6)
 * Item 12 reverse-scored (comfort with closeness = opposite of avoidance)
 * Both subscales: higher = more of that dimension
 */
export const attachment: DomainSection = {
  id: 'attachment',
  title: 'Relationship Patterns',
  intro:
    "these questions are about how you feel in close relationships — " +
    "friends, family, anyone you're close to. there are no right or wrong " +
    "patterns here, just different ways people connect.",
  timeframe: 'General patterns',
  scale: {
    points: 7,
    labels: [
      'Strongly disagree',
      'Disagree',
      'Somewhat disagree',
      'Neither agree nor disagree',
      'Somewhat agree',
      'Agree',
      'Strongly agree',
    ],
  },
  items: [
    // anxiety (sensitivity to distance / rejection)
    { id: 'at01', text: 'I worry about being abandoned or left behind in close relationships.', subscale: 'anxiety', reverse: false },
    { id: 'at02', text: 'I need a lot of reassurance that people care about me.', subscale: 'anxiety', reverse: false },
    { id: 'at03', text: "I worry that people I'm close to don't really care about me as much as I care about them.", subscale: 'anxiety', reverse: false },
    { id: 'at04', text: 'When someone important to me seems distant, I get very anxious.', subscale: 'anxiety', reverse: false },
    { id: 'at05', text: "I'm afraid that once people get to know me, they won't want to stay close.", subscale: 'anxiety', reverse: false },
    { id: 'at06', text: 'I often worry about my relationships ending.', subscale: 'anxiety', reverse: false },
    // avoidance (discomfort with closeness / dependency)
    { id: 'at07', text: 'I prefer not to show others how I feel deep down.', subscale: 'avoidance', reverse: false },
    { id: 'at08', text: 'I feel uncomfortable when people get too close to me emotionally.', subscale: 'avoidance', reverse: false },
    { id: 'at09', text: 'I find it difficult to depend on others, even when I need help.', subscale: 'avoidance', reverse: false },
    { id: 'at10', text: 'I prefer to keep some emotional distance in relationships.', subscale: 'avoidance', reverse: false },
    { id: 'at11', text: "It's hard for me to open up to others about personal things.", subscale: 'avoidance', reverse: false },
    { id: 'at12', text: "I'm comfortable being very close to others.", subscale: 'avoidance', reverse: true },
  ],
};
