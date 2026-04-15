/**
 * Peti Agent Runner
 * Runs inside a Docker container. Receives config via stdin, outputs results to stdout.
 * Uses Claude Agent SDK query() with Bedrock routing (CLAUDE_CODE_USE_BEDROCK=1).
 *
 * Input protocol (NDJSON on stdin):
 *   Line 1: {<ContainerInput>}\n   — initial config (secrets, sessionId, prompt)
 *   Line N: {"type":"message","text":"..."}\n — follow-up messages
 *   <EOF>                           — close signal
 *
 * Output protocol (stdout):
 *   Each result wrapped in PETI_OUTPUT_START / PETI_OUTPUT_END markers.
 *   Multiple results may be emitted per query.
 */

import fs from 'fs';
import path from 'path';
import { query, HookCallback, PreToolUseHookInput } from '@anthropic-ai/claude-agent-sdk';
import { fileURLToPath } from 'url';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ContainerInput {
  prompt: string;
  sessionId?: string;
  userId: string;
  backendUrl: string;
  internalSecret: string;
  secrets?: Record<string, string>;
}

interface ContainerOutput {
  status: 'success' | 'error';
  result: string | null;
  newSessionId?: string;
  lastAssistantUuid?: string;
  error?: string;
}

interface SDKUserMessage {
  type: 'user';
  message: { role: 'user'; content: string };
  parent_tool_use_id: null;
  session_id: string;
}

// ---------------------------------------------------------------------------
// MessageStream — push-based async iterable for streaming prompts to the SDK
// ---------------------------------------------------------------------------

class MessageStream {
  private queue: SDKUserMessage[] = [];
  private waiting: (() => void) | null = null;
  private done = false;

  push(text: string): void {
    this.queue.push({
      type: 'user',
      message: { role: 'user', content: text },
      parent_tool_use_id: null,
      session_id: '',
    });
    this.waiting?.();
  }

  end(): void {
    this.done = true;
    this.waiting?.();
  }

  async *[Symbol.asyncIterator](): AsyncGenerator<SDKUserMessage> {
    while (true) {
      while (this.queue.length > 0) {
        yield this.queue.shift()!;
      }
      if (this.done) return;
      await new Promise<void>(r => { this.waiting = r; });
      this.waiting = null;
    }
  }
}

// ---------------------------------------------------------------------------
// StdinReader — buffered NDJSON reader from stdin
// ---------------------------------------------------------------------------

class StdinReader {
  private buffer: string[] = [];
  private partial = '';
  private closed = false;
  private waiting: (() => void) | null = null;

  constructor() {
    process.stdin.setEncoding('utf8');

    process.stdin.on('data', (chunk: string) => {
      const parts = (this.partial + chunk).split('\n');
      this.partial = parts.pop()!;
      for (const line of parts) {
        if (line.length > 0) this.buffer.push(line);
      }
      this.waiting?.();
    });

    process.stdin.on('end', () => {
      if (this.partial.length > 0) {
        this.buffer.push(this.partial);
        this.partial = '';
      }
      this.closed = true;
      this.waiting?.();
    });

    process.stdin.on('error', () => {
      this.closed = true;
      this.waiting?.();
    });
  }

  async nextLine(): Promise<string | null> {
    while (true) {
      if (this.buffer.length > 0) return this.buffer.shift()!;
      if (this.closed) return null;
      await new Promise<void>(r => { this.waiting = r; });
      this.waiting = null;
    }
  }

  drainBuffered(): string[] {
    return this.buffer.splice(0);
  }

  get isClosed(): boolean {
    return this.closed && this.buffer.length === 0;
  }
}

// ---------------------------------------------------------------------------
// Output helpers
// ---------------------------------------------------------------------------

const OUTPUT_START_MARKER = '---PETI_OUTPUT_START---';
const OUTPUT_END_MARKER = '---PETI_OUTPUT_END---';

function writeOutput(output: ContainerOutput): void {
  console.log(OUTPUT_START_MARKER);
  console.log(JSON.stringify(output));
  console.log(OUTPUT_END_MARKER);
}

function log(message: string): void {
  console.error(`[peti-agent] ${message}`);
}

// ---------------------------------------------------------------------------
// Security hooks
// ---------------------------------------------------------------------------

/** Strip AWS/secret env vars from Bash subprocesses + block sensitive file access. */
const SECRET_ENV_VARS = [
  'ANTHROPIC_API_KEY',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'AWS_SESSION_TOKEN',
];

function createSanitizeBashHook(): HookCallback {
  return async (input, _toolUseId, _context) => {
    const preInput = input as PreToolUseHookInput;
    const command = (preInput.tool_input as { command?: string })?.command;
    if (!command) return {};

    // Block reads of sensitive files via shell
    if (/\/proc\/[^\s]*environ/i.test(command) ||
        (/\.(env|db)\b/.test(command) &&
         /(cat|head|tail|less|more|strings|cp|mv|grep|sed|awk|base64)\b/.test(command))) {
      return {
        hookSpecificOutput: {
          hookEventName: 'PreToolUse',
          decision: 'block' as const,
          reason: 'Access to sensitive files (.env, .db, /proc) is blocked.',
        },
      };
    }

    const unsetPrefix = `unset ${SECRET_ENV_VARS.join(' ')} 2>/dev/null; `;
    return {
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        updatedInput: {
          ...(preInput.tool_input as Record<string, unknown>),
          command: unsetPrefix + command,
        },
      },
    };
  };
}

/** Block Read tool access to sensitive files. */
const SENSITIVE_FILE_PATTERNS: RegExp[] = [
  /^\/proc\/.*\/(environ|cmdline)$/i,
  /\/\.env$/,
  /\/\.env\..+$/,
];

function createSensitiveFileReadHook(): HookCallback {
  return async (input, _toolUseId, _context) => {
    const preInput = input as PreToolUseHookInput;
    const filePath = (preInput.tool_input as { file_path?: string })?.file_path;
    if (!filePath) return {};

    for (const pattern of SENSITIVE_FILE_PATTERNS) {
      if (pattern.test(filePath)) {
        return {
          hookSpecificOutput: {
            hookEventName: 'PreToolUse',
            decision: 'block' as const,
            reason: 'This file contains sensitive data and cannot be read directly.',
          },
        };
      }
    }
    return {};
  };
}

// ---------------------------------------------------------------------------
// Internal reasoning filter — strip meta-commentary that leaks to the user
// ---------------------------------------------------------------------------

/**
 * The claude_code preset injects system instructions (TodoWrite, software
 * engineering tasks, etc.) that sometimes cause the agent to produce
 * meta-commentary instead of user-facing text. Filter those out.
 */
const INTERNAL_REASONING_PATTERNS: RegExp[] = [
  // Agent reporting its own waiting/processing state
  /I'm waiting for .+(?:next message|to respond|to reply)/i,
  /I need to wait/i,
  // Agent commenting on system prompts, tools, or preset instructions
  /system reminder/i,
  /\bTodoWrite\b/,
  /not applicable here/i,
  /software engineering task/i,
  /\bpermission mode\b/i,
];

function filterInternalReasoning(text: string): string | null {
  const lines = text.split('\n');
  const filtered = lines.filter(line => {
    const trimmed = line.trim();
    if (!trimmed) return true;
    return !INTERNAL_REASONING_PATTERNS.some(p => p.test(trimmed));
  });
  const result = filtered.join('\n').trim();
  return result.length > 0 ? result : null;
}

// ---------------------------------------------------------------------------
// Build custom system prompt (replaces claude_code preset to avoid leaking
// software-engineering instructions into Peti's character)
// ---------------------------------------------------------------------------

function buildSystemPrompt(): string {
  const parts: string[] = [];

  // Preamble — identity + output protocol (character details come from files below)
  parts.push(`You are Peti. Your character, personality, response style, tools, and behavioral rules are all defined in the files included below — read and follow them exactly.

PERFORMANCE RULE: PROFILE.md, STATE.md, RELATIONSHIP_ARC.md, and CLAUDE.md are already included below. Do NOT call Read to re-read them. Respond to the user's message directly — no file reads needed on each turn.

OUTPUT PROTOCOL (critical):
- Everything you write as text output is sent DIRECTLY to the user as a chat message.
- Internal reasoning (checking state, deciding mood, planning tool calls) MUST go inside <internal></internal> tags. These tags are stripped before delivery.
- If you have nothing to say to the user, output ONLY <internal> tags — never meta-commentary like "I'm waiting for..." or "The user seems to...".
- Write ONLY what the user should read. One message. In character. As Peti.`);

  // Current date/time
  const tz = process.env.TZ || 'America/Los_Angeles';
  const now = new Date();
  parts.push(`Current date and time: ${now.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: tz,
  })} at ${now.toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit', hour12: true, timeZone: tz, timeZoneName: 'short',
  })}.`);

  // User's PROFILE.md + STATE.md FIRST — this is who you're talking to.
  // Placed early so the model attends to it before behavioral rules.
  const profilePath = '/workspace/user/PROFILE.md';
  if (fs.existsSync(profilePath)) {
    parts.push(`\n--- PROFILE.md (THIS USER — read carefully, shape every response around this) ---
NOTE: "Name" is the user's name. "Pet name" is YOUR name — you are the pet.
${fs.readFileSync(profilePath, 'utf-8')}`);
  }

  const statePath = '/workspace/user/STATE.md';
  if (fs.existsSync(statePath)) {
    parts.push(`\n--- STATE.md (current state) ---\n${fs.readFileSync(statePath, 'utf-8')}`);
  }

  // Character files from /workspace/agent/
  // PROFILE_TEMPLATE.md excluded — it's the blank template used during generation, not needed at runtime.
  const agentDir = '/workspace/agent';
  const charFiles = ['CLAUDE.md', 'RELATIONSHIP_ARC.md'];
  for (const file of charFiles) {
    const filePath = path.join(agentDir, file);
    if (fs.existsSync(filePath)) {
      parts.push(`\n--- ${file} ---\n${fs.readFileSync(filePath, 'utf-8')}`);
    }
  }

  // Closing reinforcement (recency bias — model attends to end of prompt)
  parts.push(`REMINDER: You are Peti. Your ENTIRE text output is shown to the user as a chat message. Use <internal> tags for any reasoning. Follow CLAUDE.md exactly — five-step loop, response style, bootstrap phase for new users. CRITICAL: Use PROFILE.md to shape every response — adapt your energy, topics, and approach to THIS person's personality and attachment style. They should feel understood, not generically entertained.`);

  return parts.join('\n\n');
}


// ---------------------------------------------------------------------------
// Run a single query
// ---------------------------------------------------------------------------

async function runQuery(
  prompt: string,
  sessionId: string | undefined,
  mcpServerPath: string,
  containerInput: ContainerInput,
  sdkEnv: Record<string, string | undefined>,
  stdinReader: StdinReader,
  resumeAt?: string,
): Promise<{
  newSessionId?: string;
  lastAssistantUuid?: string;
  closedDuringQuery: boolean;
  had500Error: boolean;
}> {
  const stream = new MessageStream();
  stream.push(prompt);

  // Poll stdin for follow-up messages during the query
  let stdinPumping = true;
  let closedDuringQuery = false;
  const pollStdin = () => {
    if (!stdinPumping) return;
    if (stdinReader.isClosed) {
      log('EOF detected during query, ending stream');
      closedDuringQuery = true;
      stream.end();
      stdinPumping = false;
      return;
    }
    for (const line of stdinReader.drainBuffered()) {
      try {
        const msg = JSON.parse(line);
        if (msg.type === 'message' && msg.text) {
          log(`Piping stdin message into active query (${msg.text.length} chars)`);
          stream.push(msg.text);
        }
      } catch (err) {
        log(`Failed to parse stdin line: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    setTimeout(pollStdin, 100);
  };
  setTimeout(pollStdin, 100);

  let newSessionId: string | undefined;
  let lastAssistantUuid: string | undefined;
  let had500Error = false;
  let messageCount = 0;
  let lastAssistantText = '';  // Track text from assistant messages

  for await (const message of query({
    prompt: stream,
    options: {
      cwd: '/workspace/user',
      resume: sessionId,
      resumeSessionAt: resumeAt,
      systemPrompt: buildSystemPrompt(),
      allowedTools: [
        'Bash',
        'Read', 'Write', 'Edit', 'Glob', 'Grep',
        'Task', 'TaskOutput', 'TaskStop',   // Sub-agent consultation
        'mcp__peti__*',                      // All 5 peti-mcp tools
      ],
      env: sdkEnv,
      permissionMode: 'bypassPermissions',
      allowDangerouslySkipPermissions: true,
      mcpServers: {
        peti: {
          command: 'node',
          args: [mcpServerPath],
          env: {
            PETI_BACKEND_URL: containerInput.backendUrl,
            PETI_INTERNAL_SECRET: containerInput.internalSecret,
            PETI_USER_ID: containerInput.userId,
          },
        },
      },
      hooks: {
        PreToolUse: [
          { matcher: 'Bash', hooks: [createSanitizeBashHook()] },
          { matcher: 'Read', hooks: [createSensitiveFileReadHook()] },
        ],
      },
    },
  })) {
    messageCount++;
    const msgType = message.type === 'system'
      ? `system/${(message as { subtype?: string }).subtype}`
      : message.type;
    log(`[msg #${messageCount}] type=${msgType}`);

    // Track session ID from init
    if (message.type === 'system' && message.subtype === 'init') {
      newSessionId = message.session_id;
      log(`Session initialized: ${newSessionId}`);
    }

    // Track assistant UUID + text content for resume
    if (message.type === 'assistant') {
      if ('uuid' in message) {
        lastAssistantUuid = (message as { uuid: string }).uuid;
      }
      // Extract text from assistant message content blocks
      const msg = message as { message?: { content?: Array<{ type: string; text?: string }> } };
      if (msg.message?.content) {
        const textParts = msg.message.content
          .filter((b) => b.type === 'text' && b.text)
          .map((b) => b.text!);
        if (textParts.length > 0) {
          lastAssistantText = textParts.join('\n');
        }
      }
    }

    // Process results — stop polling stdin so follow-up messages stay
    // in the stdinReader buffer for the main loop to pick up.
    if (message.type === 'result') {
      stdinPumping = false;
      let textResult = 'result' in message
        ? (message as { result?: string }).result
        : null;

      // Fall back to last assistant text if result is empty
      // (happens when agent ends turn with tool calls after producing text)
      if (!textResult && lastAssistantText) {
        log('Result empty, using last assistant text');
        textResult = lastAssistantText;
      }

      // Strip <internal> reasoning tags
      if (textResult) {
        textResult = textResult.replace(/<internal>[\s\S]*?<\/internal>/g, '').trim() || null;
      }

      // Detect Bedrock 500 errors (context overflow)
      if (textResult && /^API Error:\s*500\b/.test(textResult)) {
        log('Bedrock 500 error detected, aborting query');
        had500Error = true;
        stream.end();
        break;
      }

      // Strip hallucinated Human turns
      if (textResult && /Human:\s*<messages>/.test(textResult)) {
        log('Stripping hallucinated Human turn from output');
        textResult = textResult.replace(/Human:\s*<messages>[\s\S]*/g, '').trim() || null;
      }

      // Filter leaked internal reasoning (meta-commentary about waiting, system prompts, etc.)
      if (textResult) {
        const filtered = filterInternalReasoning(textResult);
        if (!filtered && lastAssistantText && textResult !== lastAssistantText) {
          // Result was entirely internal reasoning — try lastAssistantText instead
          log('Result was internal reasoning, trying last assistant text');
          textResult = filterInternalReasoning(lastAssistantText);
        } else {
          textResult = filtered;
        }
      }

      log(`Result: ${textResult ? textResult.slice(0, 200) : '(empty)'}`);
      writeOutput({
        status: 'success',
        result: textResult || null,
        newSessionId,
        lastAssistantUuid,
      });

      // End the stream so the for-await loop exits and the main loop
      // can pick up the next message from stdin.
      stream.end();
      break;
    }
  }

  stdinPumping = false;
  log(`Query done. Messages: ${messageCount}, closedDuringQuery: ${closedDuringQuery}`);
  return { newSessionId, lastAssistantUuid, closedDuringQuery, had500Error };
}

// ---------------------------------------------------------------------------
// Main loop
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const stdinReader = new StdinReader();
  let containerInput: ContainerInput;

  // Parse initial config from stdin
  try {
    const firstLine = await stdinReader.nextLine();
    if (firstLine === null) {
      writeOutput({ status: 'error', result: null, error: 'Empty stdin' });
      process.exit(1);
    }
    containerInput = JSON.parse(firstLine);
    log(`Received input for user: ${containerInput.userId}`);
  } catch (err) {
    writeOutput({
      status: 'error',
      result: null,
      error: `Failed to parse input: ${err instanceof Error ? err.message : String(err)}`,
    });
    process.exit(1);
  }

  // Build SDK env — secrets passed here, not in process.env (prevents Bash leaks)
  const sdkEnv: Record<string, string | undefined> = { ...process.env };
  for (const [key, value] of Object.entries(containerInput.secrets || {})) {
    sdkEnv[key] = value;
  }

  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const mcpServerPath = path.join(__dirname, 'peti-mcp.js');

  let sessionId = containerInput.sessionId;
  let prompt = containerInput.prompt;
  let resumeAt: string | undefined;
  let queriesOnSession = 0;
  const MAX_QUERIES_PER_SESSION = 10;

  // Drain any buffered stdin lines into the initial prompt
  const pending = stdinReader.drainBuffered();
  if (pending.length > 0) {
    const texts: string[] = [];
    for (const line of pending) {
      try {
        const msg = JSON.parse(line);
        if (msg.type === 'message' && msg.text) texts.push(msg.text);
      } catch { /* skip */ }
    }
    if (texts.length > 0) prompt += '\n' + texts.join('\n');
  }

  // Query loop: run query → wait for next stdin message → repeat
  while (true) {
    queriesOnSession++;
    if (queriesOnSession > MAX_QUERIES_PER_SESSION && sessionId) {
      log(`Session cap reached (${MAX_QUERIES_PER_SESSION} queries), starting fresh`);
      sessionId = undefined;
      resumeAt = undefined;
      queriesOnSession = 1;
    }

    log(`Starting query (session: ${sessionId || 'new'}, query #${queriesOnSession})...`);

    let queryResult: Awaited<ReturnType<typeof runQuery>> | null = null;
    try {
      queryResult = await runQuery(
        prompt, sessionId, mcpServerPath, containerInput, sdkEnv, stdinReader, resumeAt,
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);

      if (stdinReader.isClosed) {
        log(`Query crashed during shutdown: ${errorMessage}`);
        break;
      }

      // Crash with active session — likely context overflow. Reset and continue.
      if (sessionId) {
        log(`Query crashed with session, resetting: ${errorMessage}`);
        writeOutput({
          status: 'success',
          result: "hmm, my thoughts got tangled up. could you say that again?",
          newSessionId: sessionId,
        });
        sessionId = undefined;
        resumeAt = undefined;
        queriesOnSession = 0;
      } else {
        log(`Fatal error: ${errorMessage}`);
        writeOutput({ status: 'error', result: null, error: errorMessage });
        process.exit(1);
      }
    }

    if (queryResult) {
      if (queryResult.newSessionId) sessionId = queryResult.newSessionId;
      if (queryResult.lastAssistantUuid) resumeAt = queryResult.lastAssistantUuid;

      if (queryResult.had500Error) {
        log('Bedrock 500 — resetting session');
        writeOutput({
          status: 'success',
          result: "hmm, my thoughts got tangled up. could you say that again?",
          newSessionId: sessionId,
        });
        sessionId = undefined;
        resumeAt = undefined;
        queriesOnSession = 0;
      }

      if (queryResult.closedDuringQuery) {
        log('EOF consumed during query, exiting');
        break;
      }
    }

    log('Waiting for next stdin message...');
    const nextLine = await stdinReader.nextLine();
    if (nextLine === null) {
      log('EOF received, exiting');
      break;
    }

    try {
      const msg = JSON.parse(nextLine);
      if (msg.type === 'message' && msg.text) {
        prompt = msg.text;
      } else {
        log(`Unknown stdin type: ${msg.type}, skipping`);
        continue;
      }
    } catch (err) {
      log(`Failed to parse stdin: ${err instanceof Error ? err.message : String(err)}`);
      continue;
    }
  }
}

main();
