import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import fs from 'fs';
import path from 'path';
import { prisma } from './db';
import { config } from './config';

const client = new BedrockRuntimeClient({ region: 'us-west-2' });

const MODEL_ID = 'us.anthropic.claude-sonnet-4-6';

const FRAMEWORK_FILES = [
  '00-orchestrator.md',
  '01-three-layer-model.md',
  '02-scoring-interpretation.md',
  '03-feedback-language.md',
  '04-daily-functioning.md',
  '05-sleep-regulation.md',
  '06-emotion-regulation.md',
  '07-attachment.md',
  '08-personality-functioning.md',
  '09-big-five.md',
  '10-profile-template.md',
];

let frameworkCache: string | null = null;

function loadFramework(): string {
  if (frameworkCache) return frameworkCache;

  const dir = path.resolve(config.frameworkDir);
  frameworkCache = FRAMEWORK_FILES.map(f => {
    const content = fs.readFileSync(path.join(dir, f), 'utf-8');
    return `--- ${f} ---\n${content}`;
  }).join('\n\n');

  return frameworkCache;
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

  const scoresBlock = user.profileResults.map(r => {
    const scores = r.scores as { aggregate: string; subscales: Record<string, string> };
    const subscaleLines = Object.entries(scores.subscales)
      .map(([name, band]) => `  - ${name}: ${band}`)
      .join('\n');
    return `### ${r.dimensionType}\n- Aggregate: ${scores.aggregate}\n- Subscales:\n${subscaleLines}`;
  }).join('\n\n');

  const petName = user.pet?.name || 'unnamed';
  const petDate = user.pet?.createdAt?.toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' }) || 'unknown';

  const framework = loadFramework();

  const systemPrompt = `You are a profile generation agent for Peti, a virtual companion app. Your task is to generate a rich, narrative personality profile based on the user's assessment results and the Beyond Personality Framework.

Read and follow ALL of the framework documents below. They contain the rules, domain definitions, feedback language, and output template you must use.

${framework}`;

  const userPrompt = `Generate a complete PROFILE.md for this user.

## User Info
- Username: ${user.username}
- Pet name: ${petName}
- Together since: ${petDate}

## Assessment Results

${scoresBlock}

Follow the template in 10-profile-template.md exactly. Every [Generate] section must have substantive narrative interpretation. The user spent ~10 minutes answering 106 questions across 6 domains — honor that investment with rich, specific, cross-domain narrative.`;

  const command = new InvokeModelCommand({
    modelId: MODEL_ID,
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
  const content = result.content[0].text;

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
    modelId: MODEL_ID,
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
