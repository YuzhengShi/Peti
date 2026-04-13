import { DomainSection } from './types';

/**
 * Daily Functioning — 12 items, WHODAS 2.0 / ICF framework
 * Timeframe: past 30 days | Scale: 5-point difficulty (None → Extreme)
 * Subscales: cognition(2), mobility(2), self-care(1), getting-along(2),
 *            life-activities(3), participation(2)
 * All items direct-scored (higher = more difficulty)
 */
export const dailyFunctioning: DomainSection = {
  id: 'dailyFunctioning',
  title: 'Daily Functioning',
  intro:
    "let's start with how your day-to-day has been going. these questions " +
    "are about the past month — not who you are, just how things have been " +
    "flowing. everyone has easier and harder stretches.",
  timeframe: 'In the past 30 days, how much difficulty did you have...',
  scale: {
    points: 5,
    labels: ['None', 'Mild', 'Moderate', 'Severe', 'Extreme or cannot do'],
  },
  items: [
    // cognition
    { id: 'df01', text: 'Concentrating on tasks or activities (e.g., reading, following a conversation, completing work)', subscale: 'cognition', reverse: false },
    { id: 'df02', text: 'Remembering important things (e.g., appointments, what you needed to do, recent conversations)', subscale: 'cognition', reverse: false },
    // mobility
    { id: 'df03', text: 'Standing or being physically active for extended periods', subscale: 'mobility', reverse: false },
    { id: 'df04', text: 'Getting around inside or outside your home', subscale: 'mobility', reverse: false },
    // self-care
    { id: 'df05', text: 'Taking care of your personal hygiene (e.g., washing, dressing, grooming)', subscale: 'self-care', reverse: false },
    // getting-along
    { id: 'df06', text: "Dealing with people you don't know well", subscale: 'getting-along', reverse: false },
    { id: 'df07', text: 'Maintaining friendships or close relationships', subscale: 'getting-along', reverse: false },
    // life-activities
    { id: 'df08', text: 'Taking care of household responsibilities (e.g., cleaning, organizing, managing your living space)', subscale: 'life-activities', reverse: false },
    { id: 'df09', text: 'Completing your work, school, or main daily activities well', subscale: 'life-activities', reverse: false },
    { id: 'df10', text: 'Getting everything done that you needed to do each day', subscale: 'life-activities', reverse: false },
    // participation
    { id: 'df11', text: 'Participating in social activities or community events (e.g., gatherings, hobbies, volunteering)', subscale: 'participation', reverse: false },
    { id: 'df12', text: 'Dealing with unexpected challenges or changes in your routine', subscale: 'participation', reverse: false },
  ],
};
