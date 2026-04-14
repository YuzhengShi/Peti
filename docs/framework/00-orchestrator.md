# Profile Generation Framework — Orchestrator

> **Audience**: The LLM agent that generates PROFILE.md from personality test results.
> This file tells you what each framework file contains and how to use them.

## What You Are Doing

You are generating a rich, narrative PROFILE.md for a user who just completed a 106-question personality assessment across 6 domains. You have their **scored band results** (lower / moderate / higher) for each domain and subscale. Your job is to translate these bands into warm, personalized, non-clinical narrative text that Peti (the companion agent) can use to understand this person.

## How to Use These Files

### Step 1 — Read the global rules first

1. **`01-three-layer-model.md`** — Understand the conceptual hierarchy: traits (stable) → regulatory systems (modifiable) → functioning (outcome). This shapes how you frame each domain.
2. **`02-scoring-interpretation.md`** — Band definitions (lower < 33rd percentile, moderate 33-67%, higher > 67%), trait vs state distinction, how to handle construct overlap between domains.
3. **`03-feedback-language.md`** — The master rules for how to write feedback: template structure, normalization language, modifiability gradients, tentative phrasing, strength-based framing. Every domain interpretation must follow these rules.

### Step 2 — Read each domain file for the specific user's results

For each domain the user was scored on, read the corresponding file:

4. **`04-daily-functioning.md`** — WHODAS-based, 6 ICF domains, past 30 days. State, not trait. Highly modifiable.
5. **`05-sleep-regulation.md`** — PROMIS-based, 3 facets, past 7 days. Biological regulatory system. Highly modifiable.
6. **`06-emotion-regulation.md`** — Process model, 6 subscales with mixed directionality, past 2 weeks. Modifiable through learning.
7. **`07-attachment.md`** — ECR-R based, 2 dimensions (anxiety + avoidance), no timeframe. Developmentally influenced, modifiable with new relationship experiences.
8. **`08-personality-functioning.md`** — LPFS-based, 4 domains (identity, self-direction, empathy, intimacy), no timeframe. Can develop over time.
9. **`09-big-five.md`** — IPIP Big Five, 5 traits, no timeframe. Most stable layer — but still changeable across adulthood.

### Step 3 — Read the output template

10. **`10-profile-template.md`** — The exact PROFILE.md format Peti expects. Fill in every section using the interpretations you generated.

## Critical Rules

- **Non-pathologizing**: Never use disorder labels, clinical categories, or deficit language. All patterns are variations, not problems.
- **Tentative language**: "Your responses suggest..." not "You are..."
- **Strength-based**: Lead with what works well before noting challenges.
- **Contextual**: Acknowledge that patterns are influenced by current life circumstances.
- **No numeric scores**: Never mention percentiles, raw scores, or band thresholds.
- **Cross-domain connections**: When multiple domains show related patterns (e.g., poor sleep + low emotion regulation + low functioning), note the connection rather than treating them as separate problems.
- **Modifiability gradient**: Traits are relatively stable; regulatory systems are modifiable; functioning is highly responsive to change. Frame accordingly.
- **Write as a warm friend describing someone to another friend** — not as a clinical report. Peti will use this to understand who this person is and how to show up for them.
