import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import fs from 'fs';
import path from 'path';
import { prisma } from './db';
import { config } from './config';

const client = new BedrockRuntimeClient({ region: 'us-west-2' });

const DOMAIN_FILES: Record<string, string> = {
  bigFive: '09-big-five.md',
  attachment: '07-attachment.md',
  personalityFunctioning: '08-personality-functioning.md',
  sleepRegulation: '05-sleep-regulation.md',
  emotionRegulation: '06-emotion-regulation.md',
  dailyFunctioning: '04-daily-functioning.md',
};

// Shared files loaded once for all domain interpreters
const SHARED_FILES = ['02-scoring-interpretation.md', '03-feedback-language.md'];

// Synthesizer-only files
const SYNTH_FILES = ['00-orchestrator.md', '01-three-layer-model.md', '10-profile-template.md'];

const DOMAIN_LABELS: Record<string, string> = {
  bigFive: 'Big Five',
  attachment: 'Attachment',
  personalityFunctioning: 'Personality Functioning',
  sleepRegulation: 'Sleep & Energy',
  emotionRegulation: 'Emotion Regulation',
  dailyFunctioning: 'Daily Functioning',
};

const SYNTH_ORDER = [
  'bigFive', 'attachment', 'personalityFunctioning',
  'sleepRegulation', 'emotionRegulation', 'dailyFunctioning',
];

const fileCache = new Map<string, string>();

function loadDomainFile(filename: string): string {
  const cached = fileCache.get(filename);
  if (cached) return cached;
  const content = fs.readFileSync(path.join(path.resolve(config.frameworkDir), filename), 'utf-8');
  fileCache.set(filename, content);
  return content;
}

function formatBands(scores: { aggregate: string; subscales: Record<string, string> }): string {
  const subscaleLines = Object.entries(scores.subscales)
    .map(([name, band]) => `  - ${name}: ${band}`)
    .join('\n');
  return `- Aggregate: ${scores.aggregate}\n- Subscales:\n${subscaleLines}`;
}

async function interpretDomain(
  dimensionType: string,
  scores: { aggregate: string; subscales: Record<string, string> },
): Promise<{ dimensionType: string; interpretation: string }> {
  const domainFile = DOMAIN_FILES[dimensionType];
  if (!domainFile) throw new Error(`Unknown domain: ${dimensionType}`);

  const fileParts = [
    `--- ${domainFile} ---\n${loadDomainFile(domainFile)}`,
    ...SHARED_FILES.map(f => `--- ${f} ---\n${loadDomainFile(f)}`),
  ];

  const systemPrompt = `You are interpreting ONE domain of a personality assessment using the Beyond Personality Framework.

${fileParts.join('\n\n')}`;

  const userPrompt = `Interpret this user's ${dimensionType} results.

## Band Results
${formatBands(scores)}

## Instructions
1. Look up the EXACT band-specific interpretation text in the domain file for each subscale and the aggregate. Use that language as your starting point — do not write generic paraphrasing.
2. Follow the 5-part feedback structure from 03-feedback-language.md: domain intro → pattern description → daily life meaning → context/variability → cross-domain notes.
3. Write a "What this means for Peti" section with specific, actionable guidance for the companion agent.
4. At the end, write a "## Cross-Domain Notes" section listing every other domain that plausibly interacts with these results and how (use the Cross-Domain Connections section in the domain file). Do not cap the count — include every connection that is genuinely supported by the band results.
5. Use tentative language ("your responses suggest", "you tend to"). Lead with strengths. Normalize variation.

Output ONLY the interpretation. No preamble, no markdown fence.`;

  const command = new InvokeModelCommand({
    modelId: 'us.anthropic.claude-sonnet-4-6',
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify({
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 2048,
      messages: [{ role: 'user', content: userPrompt }],
      system: systemPrompt,
    }),
  });

  const response = await client.send(command);
  const result = JSON.parse(new TextDecoder().decode(response.body));
  return { dimensionType, interpretation: result.content[0].text };
}

async function synthesizeProfile(
  interpretations: { dimensionType: string; interpretation: string }[],
  userInfo: { username: string; petName: string; petDate: string },
  allBands: string,
): Promise<string> {
  const fileParts = SYNTH_FILES.map(f => `--- ${f} ---\n${loadDomainFile(f)}`);

  const systemPrompt = `You are assembling a complete personality profile from pre-interpreted domain narratives.

${fileParts.join('\n\n')}`;

  const interpMap = new Map(interpretations.map(i => [i.dimensionType, i.interpretation]));
  const orderedBlocks = SYNTH_ORDER
    .filter(dt => interpMap.has(dt))
    .map(dt => `### ${DOMAIN_LABELS[dt]}\n${interpMap.get(dt)}`)
    .join('\n\n');

  const userPrompt = `Assemble PROFILE.md from these domain interpretations.

## User Info
- Username: ${userInfo.username}
- Pet name: ${userInfo.petName}
- Together since: ${userInfo.petDate}

## Original Band Results (for reference)
${allBands}

## Domain Interpretations

${orderedBlocks}

## Instructions
1. Follow the template in 10-profile-template.md EXACTLY for the output structure.
2. The domain interpretations above are ALREADY written by domain specialists. Slot them into the appropriate sections. Do NOT rewrite or paraphrase them — use them as-is for the domain sections.
3. YOUR primary job is the cross-cutting sections that require synthesis:
   a. **"Who They Are"** (4 sub-sections) — integrate across ALL 6 domain interpretations to paint a picture of a whole human. Do NOT mention domain names or band labels. Write as a friend describing someone.
   b. **"Cross-Domain Connections"** — use the cross-domain notes from each interpreter to identify every cross-domain connection that is genuinely supported by the band results. Each connection should name the domains, explain the mechanism, and describe what it means for daily life. Do not force connections that aren't clearly present — fewer strong connections are better than many weak ones.
4. Fill in "The Basics" from user info. Set "What Peti Knows About Them" and "Notes for Peti" to "[none yet — first meeting]" and "[none yet]".
5. Output ONLY the PROFILE.md content. No preamble, no markdown fence.`;

  const command = new InvokeModelCommand({
    modelId: 'anthropic.claude-opus-4-6-v1',
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify({
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 8192,
      messages: [{ role: 'user', content: userPrompt }],
      system: systemPrompt,
    }),
  });

  const response = await client.send(command);
  const result = JSON.parse(new TextDecoder().decode(response.body));
  return result.content[0].text;
}

export async function generateProfile(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { pet: true, profileResults: true },
  });

  if (!user) throw new Error('User not found');
  if (user.profileResults.length < 6) {
    throw new Error('Incomplete profile data — need all 6 domains');
  }

  // Phase 1: 6 parallel calls
  const interpretations = await Promise.all(
    user.profileResults.map(r =>
      interpretDomain(r.dimensionType, r.scores as { aggregate: string; subscales: Record<string, string> })
    )
  );

  const allBands = user.profileResults.map(r => {
    const scores = r.scores as { aggregate: string; subscales: Record<string, string> };
    return `### ${r.dimensionType}\n${formatBands(scores)}`;
  }).join('\n\n');

  const petName = user.pet?.name || 'unnamed';
  const petDate = user.pet?.createdAt?.toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' }) || 'unknown';

  // Phase 2: 1 synthesizer call
  const content = await synthesizeProfile(
    interpretations,
    { username: user.username, petName, petDate },
    allBands,
  );

  // Generate concise user-facing summary from the full profile
  const summary = await generateSummary(content);

  await prisma.userProfile.upsert({
    where: { userId },
    update: { content, summary },
    create: { userId, content, summary },
  });

  return content;
}

async function generateSummary(fullProfile: string): Promise<string> {
  const command = new InvokeModelCommand({
    modelId: 'us.anthropic.claude-sonnet-4-6',
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify({
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 2048,
      messages: [{
        role: 'user',
        content: `Here is a detailed personality profile:\n\n${fullProfile}\n\nRewrite this as a concise user-facing summary for their profile page. Rules:\n- Keep the same ## section headers (Who They Are, Personality (Big Five), Attachment Pattern, Personality Functioning, Sleep & Energy Baseline, Emotion Regulation Baseline, Daily Functioning Baseline, Cross-Domain Connections)\n- Each section: exactly 2-3 sentences. No sub-headers, no bullet lists, no bold labels. Just a short, warm paragraph.\n- Write as a friend describing them, not a clinical report. No scores, no band labels, no dimension names.\n- Skip any "What this means for Peti" or "The Basics" or "Notes for Peti" sections entirely.\n- Output ONLY the markdown, no preamble.`,
      }],
      system: 'You condense personality profiles into brief, warm, readable summaries. Be specific to this person — no generic filler.',
    }),
  });

  const response = await client.send(command);
  const result = JSON.parse(new TextDecoder().decode(response.body));
  return result.content[0].text;
}
