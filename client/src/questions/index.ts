import { DomainSection } from './types';
import { dailyFunctioning } from './dailyfunctioning';
import { sleep } from './sleep';
import { emotionReg } from './emotionreg';
import { attachment } from './attachment';
import { functioning } from './functioning';
import { bigFive } from './bigfive';

/**
 * Ordered array of all 6 domain sections (106 items total).
 * Order is FIXED: functioning-first, traits-last (evidence-based).
 * PersonalityTestPage renders sections in this order.
 * Do NOT reorder — see framework Section 3 for rationale.
 */
export const domainSections: DomainSection[] = [
  dailyFunctioning, // 12 items — Layer 3 outcome anchor
  sleep,            //  8 items — Layer 2 biological regulatory
  emotionReg,       // 12 items — Layer 2 modifiable patterns
  attachment,       // 12 items — Layer 2 relational patterns
  functioning,      // 12 items — Layer 2 personality organization
  bigFive,          // 50 items — Layer 1 stable traits
];

export { dailyFunctioning, sleep, emotionReg, attachment, functioning, bigFive };
export type { DomainSection, DimensionType, QuestionItem, ScaleConfig } from './types';
