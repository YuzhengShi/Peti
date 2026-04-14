import { DomainSection } from './types';

/**
 * Big Five Personality Traits — 50 items, IPIP-informed original items
 * Timeframe: general tendencies | Scale: 5-point agreement
 * Subscales: neuroticism(10), extraversion(10), openness(10),
 *            agreeableness(10), conscientiousness(10)
 * Mixed keying per trait (4 reverse for N; 3 reverse each for E/A/C; 2 reverse for O)
 */
export const bigFive: DomainSection = {
  id: 'bigFive',
  title: 'Personality Traits',
  intro:
    "last stretch! these are about your general tendencies — how you " +
    "usually are, not how you've been feeling lately. go with your gut " +
    "on each one. you're almost done!",
  timeframe: 'General tendencies',
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
    // ── Neuroticism (10 items: 6 direct, 4 reverse) ──
    { id: 'bf01', text: 'I worry about things.', subscale: 'neuroticism', reverse: false },
    { id: 'bf02', text: 'I get stressed out easily.', subscale: 'neuroticism', reverse: false },
    { id: 'bf03', text: 'I am relaxed most of the time.', subscale: 'neuroticism', reverse: true },
    { id: 'bf04', text: 'I get upset easily.', subscale: 'neuroticism', reverse: false },
    { id: 'bf05', text: 'I remain calm in tense situations.', subscale: 'neuroticism', reverse: true },
    { id: 'bf06', text: 'I feel anxious often.', subscale: 'neuroticism', reverse: false },
    { id: 'bf07', text: 'I handle stress well.', subscale: 'neuroticism', reverse: true },
    { id: 'bf08', text: 'My mood changes frequently.', subscale: 'neuroticism', reverse: false },
    { id: 'bf09', text: 'I stay composed under pressure.', subscale: 'neuroticism', reverse: true },
    { id: 'bf10', text: 'I tend to feel nervous.', subscale: 'neuroticism', reverse: false },

    // ── Extraversion (10 items: 7 direct, 3 reverse) ──
    { id: 'bf11', text: 'I enjoy being around people.', subscale: 'extraversion', reverse: false },
    { id: 'bf12', text: 'I feel energized by social interaction.', subscale: 'extraversion', reverse: false },
    { id: 'bf13', text: 'I prefer quiet, solitary activities.', subscale: 'extraversion', reverse: true },
    { id: 'bf14', text: 'I am talkative in groups.', subscale: 'extraversion', reverse: false },
    { id: 'bf15', text: 'I like being the center of attention.', subscale: 'extraversion', reverse: false },
    { id: 'bf16', text: 'I need time alone to recharge.', subscale: 'extraversion', reverse: true },
    { id: 'bf17', text: 'I start conversations easily.', subscale: 'extraversion', reverse: false },
    { id: 'bf18', text: 'I am comfortable in large social gatherings.', subscale: 'extraversion', reverse: false },
    { id: 'bf19', text: 'I keep to myself in social situations.', subscale: 'extraversion', reverse: true },
    { id: 'bf20', text: 'I seek out social opportunities.', subscale: 'extraversion', reverse: false },

    // ── Openness to Experience (10 items: 8 direct, 2 reverse) ──
    { id: 'bf21', text: 'I enjoy exploring new ideas.', subscale: 'openness', reverse: false },
    { id: 'bf22', text: 'I am curious about many different things.', subscale: 'openness', reverse: false },
    { id: 'bf23', text: 'I prefer familiar routines to new experiences.', subscale: 'openness', reverse: true },
    { id: 'bf24', text: 'I appreciate art, music, or literature.', subscale: 'openness', reverse: false },
    { id: 'bf25', text: 'I like to think about abstract concepts.', subscale: 'openness', reverse: false },
    { id: 'bf26', text: 'I am interested in learning new things.', subscale: 'openness', reverse: false },
    { id: 'bf27', text: 'I prefer practical matters to theoretical ones.', subscale: 'openness', reverse: true },
    { id: 'bf28', text: 'I have a vivid imagination.', subscale: 'openness', reverse: false },
    { id: 'bf29', text: 'I enjoy trying unfamiliar activities.', subscale: 'openness', reverse: false },
    { id: 'bf30', text: 'I value creativity and originality.', subscale: 'openness', reverse: false },

    // ── Agreeableness (10 items: 7 direct, 3 reverse) ──
    { id: 'bf31', text: "I am considerate of others' feelings.", subscale: 'agreeableness', reverse: false },
    { id: 'bf32', text: 'I try to be cooperative rather than competitive.', subscale: 'agreeableness', reverse: false },
    { id: 'bf33', text: 'I can be critical of others.', subscale: 'agreeableness', reverse: true },
    { id: 'bf34', text: 'I am generally trusting of people.', subscale: 'agreeableness', reverse: false },
    { id: 'bf35', text: 'I value harmony in relationships.', subscale: 'agreeableness', reverse: false },
    { id: 'bf36', text: 'I can be argumentative.', subscale: 'agreeableness', reverse: true },
    { id: 'bf37', text: "I am sympathetic to others' difficulties.", subscale: 'agreeableness', reverse: false },
    { id: 'bf38', text: "I tend to be skeptical of others' intentions.", subscale: 'agreeableness', reverse: true },
    { id: 'bf39', text: 'I am patient with people.', subscale: 'agreeableness', reverse: false },
    { id: 'bf40', text: "I prioritize others' needs alongside my own.", subscale: 'agreeableness', reverse: false },

    // ── Conscientiousness (10 items: 7 direct, 3 reverse) ──
    { id: 'bf41', text: 'I am organized and methodical.', subscale: 'conscientiousness', reverse: false },
    { id: 'bf42', text: 'I follow through on my commitments.', subscale: 'conscientiousness', reverse: false },
    { id: 'bf43', text: 'I tend to be disorganized.', subscale: 'conscientiousness', reverse: true },
    { id: 'bf44', text: 'I plan ahead rather than act spontaneously.', subscale: 'conscientiousness', reverse: false },
    { id: 'bf45', text: 'I pay attention to details.', subscale: 'conscientiousness', reverse: false },
    { id: 'bf46', text: 'I procrastinate on tasks.', subscale: 'conscientiousness', reverse: true },
    { id: 'bf47', text: 'I am disciplined in my work.', subscale: 'conscientiousness', reverse: false },
    { id: 'bf48', text: 'I prefer flexibility to strict schedules.', subscale: 'conscientiousness', reverse: true },
    { id: 'bf49', text: 'I complete tasks thoroughly.', subscale: 'conscientiousness', reverse: false },
    { id: 'bf50', text: 'I am reliable and dependable.', subscale: 'conscientiousness', reverse: false },
  ],
};
