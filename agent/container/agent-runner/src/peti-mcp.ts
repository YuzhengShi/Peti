/**
 * Peti MCP Server — stdio transport
 * Provides 5 tools for the Peti agent to persist state, store memories,
 * and communicate with the frontend in real time.
 *
 * Env vars (set by agent-runner via mcpServers config):
 *   PETI_BACKEND_URL    — e.g. http://host.docker.internal:3001
 *   PETI_INTERNAL_SECRET — shared secret for /internal/* endpoints
 *   PETI_USER_ID        — the user this container serves
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import fs from 'fs';

const BACKEND_URL = process.env.PETI_BACKEND_URL!;
const INTERNAL_SECRET = process.env.PETI_INTERNAL_SECRET!;
const USER_ID = process.env.PETI_USER_ID!;
const STATE_PATH = '/workspace/user/STATE.md';
const PROFILE_PATH = '/workspace/user/PROFILE.md';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function log(message: string): void {
  console.error(`[peti-mcp] ${message}`);
}

async function internalPost(path: string, body: object): Promise<unknown> {
  const url = `${BACKEND_URL}/api/internal${path}`;
  log(`POST ${url}`);
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-internal-secret': INTERNAL_SECRET,
    },
    body: JSON.stringify({ userId: USER_ID, ...body }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Internal API error ${res.status}: ${text}`);
  }
  return res.json();
}

async function internalGet(path: string, params: Record<string, string>): Promise<unknown> {
  const url = new URL(`${BACKEND_URL}/api/internal${path}`);
  url.searchParams.set('userId', USER_ID);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  log(`GET ${url.toString()}`);
  const res = await fetch(url.toString(), {
    headers: { 'x-internal-secret': INTERNAL_SECRET },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Internal API error ${res.status}: ${text}`);
  }
  return res.json();
}

/** Read STATE.md as key-value pairs. */
function readState(): Record<string, string> {
  if (!fs.existsSync(STATE_PATH)) return {};
  const lines = fs.readFileSync(STATE_PATH, 'utf-8').split('\n');
  const state: Record<string, string> = {};
  for (const line of lines) {
    const idx = line.indexOf(':');
    if (idx > 0) {
      state[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
    }
  }
  return state;
}

/** Write STATE.md from key-value pairs. */
function writeState(state: Record<string, string>): void {
  const content = Object.entries(state)
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n') + '\n';
  fs.writeFileSync(STATE_PATH, content);
}

// ---------------------------------------------------------------------------
// MCP Server
// ---------------------------------------------------------------------------

const server = new McpServer({
  name: 'peti',
  version: '1.0.0',
});

// ---- pet_update ----
// Updates pet's current state (mood, energy, animation, etc.)
server.tool(
  'pet_update',
  `Update Peti's current state. Call after any mood/energy shift in conversation.
Set animation BEFORE your response so the sprite matches what you say.

Valid fields and values:
- mood: happy | content | worried | low | excited | tired | flat | lonely
- energy: vibrant | good | moderate | low | exhausted
- animation: idle | sparkling_bounce | spinning_question | running_magnifying | rain_cloud | sleeping_zzz | heart_eyes | reading_glasses | confetti | slight_tremble | curious_head_tilt
- activity: chatting | thinking | resting | sleeping | wandering
- last_felt: free text (e.g. "proud — user finished a hard project")
- pending_proactive_message: free text (cleared after delivery) or empty string`,
  {
    field: z.enum([
      'mood', 'energy', 'animation', 'activity',
      'last_felt', 'pending_proactive_message',
    ]).describe('Which state field to update'),
    value: z.string().describe('New value for the field'),
  },
  async (args) => {
    try {
      // 1. Update STATE.md on disk
      const state = readState();
      state[args.field] = args.value;
      writeState(state);

      // 2. POST to backend — updates DB + pushes SSE state event for mood/animation
      await internalPost('/pet-state', {
        field: args.field,
        value: args.value,
      });

      return { content: [{ type: 'text' as const, text: `Updated ${args.field} to "${args.value}"` }] };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      log(`pet_update error: ${msg}`);
      return { content: [{ type: 'text' as const, text: `Error: ${msg}` }] };
    }
  },
);

// ---- memory_create ----
// Stores a meaningful moment as a long-term memory
server.tool(
  'memory_create',
  `Store a meaningful moment as a long-term memory.

Categories:
- observation: pattern noticed in user behavior/emotional state
- strategy: advice given + whether it worked on follow-up
- preference: stable thing learned about user (likes, dislikes, response patterns)
- milestone: something user achieved, overcame, or marked as significant

Importance (1-5):
1=nice detail, 2=useful context, 3=meaningful moment, 4=significant event, 5=life event`,
  {
    content: z.string().describe('1-3 sentences describing what happened'),
    category: z.enum(['observation', 'strategy', 'preference', 'milestone']),
    importance: z.number().int().min(1).max(5).describe('1=nice detail, 5=life event'),
  },
  async (args) => {
    try {
      const result = await internalPost('/memory', {
        content: args.content,
        category: args.category,
        importance: args.importance,
      }) as { data: { id: string } };

      return { content: [{ type: 'text' as const, text: `Memory saved (id: ${result.data.id})` }] };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      log(`memory_create error: ${msg}`);
      return { content: [{ type: 'text' as const, text: `Error: ${msg}` }] };
    }
  },
);

// ---- memory_query ----
// Retrieves relevant memories for the current conversation context
server.tool(
  'memory_query',
  `Retrieve relevant memories via semantic search.

When to call:
- When user references something from the past ("remember when...")
- When user mentions a person/place/thing Peti should know about
- At session start if days_since_last_chat >= 3`,
  {
    query: z.string().describe('What to search for (natural language)'),
    limit: z.number().int().min(1).max(20).default(5).describe('Max results (default 5)'),
  },
  async (args) => {
    try {
      const result = await internalGet('/memory', {
        q: args.query,
        limit: String(args.limit),
      }) as { data: { memories: Array<{ id: string; content: string; category: string; importance: number; createdAt: string }> } };

      const memories = result.data.memories;
      if (memories.length === 0) {
        return { content: [{ type: 'text' as const, text: 'No matching memories found.' }] };
      }

      const formatted = memories.map((m, i) =>
        `${i + 1}. [${m.category}, importance ${m.importance}] ${m.content} (${m.createdAt})`
      ).join('\n');

      return { content: [{ type: 'text' as const, text: `Found ${memories.length} memories:\n${formatted}` }] };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      log(`memory_query error: ${msg}`);
      return { content: [{ type: 'text' as const, text: `Error: ${msg}` }] };
    }
  },
);

// ---- profile_update ----
// Updates a stable personality field in PROFILE.md
server.tool(
  'profile_update',
  `Update a personality field in PROFILE.md. Use sparingly — only for genuine learning.

Valid fields and values:
- openness/conscientiousness/extraversion/agreeableness/neuroticism: very low | low | moderate | high | very high
- relationship_stage: stranger | acquaintance | companion | deep_bond
- attachment_style: secure | anxious | avoidant | disorganized
- functioning: high | moderate | low

When field is "relationship_stage" and it advances, backend increments Pet.level
and pushes a state SSE event with the new spriteSheet URL (evolution).`,
  {
    field: z.string().describe('Profile field to update (e.g. "openness", "relationship_stage")'),
    value: z.string().describe('Plain English value (e.g. "high", "companion")'),
    note: z.string().describe('Reason for the update'),
  },
  async (args) => {
    try {
      // 1. Update PROFILE.md on disk
      if (fs.existsSync(PROFILE_PATH)) {
        let content = fs.readFileSync(PROFILE_PATH, 'utf-8');

        // Try to find and replace the field value in the profile
        const fieldRegex = new RegExp(`(${args.field}\\s*[:=]\\s*)(.+)`, 'i');
        if (fieldRegex.test(content)) {
          content = content.replace(fieldRegex, `$1${args.value}`);
        }

        // Append note to "Notes for Peti" section
        const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });
        const noteEntry = `\n- [${today}] ${args.field}: ${args.value} — ${args.note}`;
        if (content.includes('Notes for Peti')) {
          content = content.replace(/(Notes for Peti.*)/s, `$1${noteEntry}`);
        } else {
          content += `\n\n## Notes for Peti${noteEntry}`;
        }

        fs.writeFileSync(PROFILE_PATH, content);
      }

      // 2. POST to backend — updates DB, handles evolution side effects
      await internalPost('/profile', {
        field: args.field,
        value: args.value,
        note: args.note,
        content: fs.existsSync(PROFILE_PATH)
          ? fs.readFileSync(PROFILE_PATH, 'utf-8')
          : undefined,
      });

      return { content: [{ type: 'text' as const, text: `Updated ${args.field} to "${args.value}"` }] };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      log(`profile_update error: ${msg}`);
      return { content: [{ type: 'text' as const, text: `Error: ${msg}` }] };
    }
  },
);

// ---- send_message ----
// Sends an immediate message to the user while the agent is still processing
server.tool(
  'send_message',
  `Send an immediate message to the user while still processing.
Use for: "give me a sec...", "thinking about that...", multi-part responses.
Use sparingly — normal responses go through text output, not this tool.`,
  {
    text: z.string().describe('The message text to send immediately'),
  },
  async (args) => {
    // Write sentinel to stdout — container-runner intercepts and forwards to SSE
    const sentinel = JSON.stringify({ type: 'send_message', text: args.text });
    process.stdout.write(`---PETI_SEND_MESSAGE_START---\n${sentinel}\n---PETI_SEND_MESSAGE_END---\n`);

    return { content: [{ type: 'text' as const, text: 'Message sent.' }] };
  },
);

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  log(`Starting peti-mcp for user ${USER_ID}`);
  log(`Backend: ${BACKEND_URL}`);

  const transport = new StdioServerTransport();
  await server.connect(transport);

  log('MCP server connected via stdio');
}

main().catch((err) => {
  log(`Fatal: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
