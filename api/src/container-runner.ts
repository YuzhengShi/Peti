/**
 * Container Runner — manages Docker containers running the Peti agent.
 * One persistent container per user. Communicates via stdin/stdout.
 *
 * Pattern borrowed from TAi's container-runner.ts:
 * - Secrets passed via stdin JSON (never Docker env vars)
 * - stdout sentinel markers (PETI_OUTPUT_START/END) parsed in real-time
 * - send_message sentinel intercepted for immediate SSE push
 */

import { spawn, ChildProcess, execSync } from 'child_process';
import { Writable } from 'stream';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { config } from './config';
import { sessionStore } from './session-store';
import { profileManager } from './profile-manager';

/**
 * Convert Windows backslash paths to forward-slash for Docker volume mounts.
 * e.g. C:\Users\foo\bar → C:/Users/foo/bar
 */
function toDockerPath(p: string): string {
  return p.replace(/\\/g, '/');
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ContainerOutput {
  status: 'success' | 'error';
  result: string | null;
  newSessionId?: string;
  lastAssistantUuid?: string;
  error?: string;
}

export type OutputCallback = (output: ContainerOutput) => Promise<void>;
export type SendMessageCallback = (text: string) => void;

interface UserContainer {
  name: string;
  process: ChildProcess;
  stdin: Writable;
  onOutput: OutputCallback | null;
  onSendMessage: SendMessageCallback | null;
  parseBuffer: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const OUTPUT_START_MARKER = '---PETI_OUTPUT_START---';
const OUTPUT_END_MARKER = '---PETI_OUTPUT_END---';
const SEND_MSG_START = '---PETI_SEND_MESSAGE_START---';
const SEND_MSG_END = '---PETI_SEND_MESSAGE_END---';

const CONTAINER_IMAGE = process.env.CONTAINER_IMAGE || 'peti-agent:latest';
const AGENT_CHARACTER_DIR = path.resolve(process.env.AGENT_CHARACTER_DIR || '../agent/character');
const INTERNAL_SECRET = process.env.INTERNAL_SECRET || 'dev-internal-secret';
const BACKEND_URL = process.env.BACKEND_URL || 'http://host.docker.internal:3001';

const MAX_START_RETRIES = 3;
const RETRY_COOLDOWN_MS = 30_000; // 30 seconds

// ---------------------------------------------------------------------------
// ContainerRunner
// ---------------------------------------------------------------------------

class ContainerRunner {
  private containers = new Map<string, UserContainer>();
  private failedStarts = new Map<string, { count: number; lastAttempt: number }>();

  /**
   * Ensure a user's container is running. Starts one if not.
   */
  async ensureRunning(userId: string): Promise<void> {
    if (this.containers.has(userId) && await this.isAlive(userId)) {
      return;
    }

    // Retry guard — prevent infinite restart loop
    const failure = this.failedStarts.get(userId);
    if (failure) {
      if (failure.count >= MAX_START_RETRIES) {
        if (Date.now() - failure.lastAttempt < RETRY_COOLDOWN_MS) {
          throw new Error(
            `Container for ${userId} failed ${failure.count} times. ` +
            `Cooling down for ${Math.ceil((RETRY_COOLDOWN_MS - (Date.now() - failure.lastAttempt)) / 1000)}s.`,
          );
        }
        // Cooldown expired — reset and allow retry
        this.failedStarts.delete(userId);
      }
    }

    // Clean up stale entry if exists
    this.containers.delete(userId);

    // Write PROFILE.md + STATE.md to temp directory
    await profileManager.writeUserFiles(userId);

    const containerName = `peti-${userId}`;

    // Kill any leftover container with this name
    try {
      execSync(`docker rm -f ${containerName}`, { stdio: 'ignore' });
    } catch { /* doesn't exist, fine */ }

    const sessionDir = profileManager.getSessionDir(userId);

    const args = [
      'run', '-i', '--rm',
      '--name', containerName,
      '--memory', '2g',
      '--cpus', '0.5',
      '--cap-drop', 'ALL',
      '--security-opt', 'no-new-privileges',
      '--add-host', 'host.docker.internal:host-gateway',
      '-v', `${toDockerPath(profileManager.getUserDir(userId))}:/workspace/user`,
      '-v', `${toDockerPath(AGENT_CHARACTER_DIR)}:/workspace/agent:ro`,
      '-v', `${toDockerPath(sessionDir)}:/home/node/.claude`,
    ];

    // Mount host AWS config for credential chain (credentials file, SSO cache, etc.)
    const awsDir = path.join(os.homedir(), '.aws');
    if (fs.existsSync(awsDir)) {
      args.push('-v', `${toDockerPath(awsDir)}:/home/node/.aws:ro`);
    }

    args.push(CONTAINER_IMAGE);

    console.log(`[container-runner] Starting container ${containerName}`);

    const proc = spawn('docker', args, {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    const userContainer: UserContainer = {
      name: containerName,
      process: proc,
      stdin: proc.stdin!,
      onOutput: null,
      onSendMessage: null,
      parseBuffer: '',
    };

    this.containers.set(userId, userContainer);

    // Attach stdout parser
    proc.stdout!.on('data', (chunk: Buffer) => {
      this.parseStdout(userId, chunk.toString());
    });

    // Log stderr (agent-runner logs)
    proc.stderr!.on('data', (chunk: Buffer) => {
      const lines = chunk.toString().split('\n').filter(Boolean);
      for (const line of lines) {
        console.log(`[peti-${userId}] ${line}`);
      }
    });

    // Handle container exit
    proc.on('exit', (code) => {
      console.log(`[container-runner] Container ${containerName} exited (code ${code})`);
      this.containers.delete(userId);

      // Track failed starts (non-zero exit within 5s = likely startup failure)
      if (code !== 0) {
        const prev = this.failedStarts.get(userId);
        this.failedStarts.set(userId, {
          count: (prev?.count || 0) + 1,
          lastAttempt: Date.now(),
        });
      } else {
        // Successful session — reset failure counter
        this.failedStarts.delete(userId);
      }
    });

    // Send initial config via stdin (secrets here, not env vars)
    const sessionId = await sessionStore.get(userId);

    const initPayload = {
      prompt: '', // Will be set by sendMessage
      sessionId: sessionId || undefined,
      userId,
      backendUrl: BACKEND_URL,
      internalSecret: INTERNAL_SECRET,
      secrets: {
        ...(process.env.AWS_ACCESS_KEY_ID ? { AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID } : {}),
        ...(process.env.AWS_SECRET_ACCESS_KEY ? { AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY } : {}),
        ...(process.env.AWS_SESSION_TOKEN ? { AWS_SESSION_TOKEN: process.env.AWS_SESSION_TOKEN } : {}),
        ...(process.env.AWS_REGION ? { AWS_REGION: process.env.AWS_REGION } : {}),
        ...(process.env.AWS_DEFAULT_REGION ? { AWS_DEFAULT_REGION: process.env.AWS_DEFAULT_REGION } : {}),
        ...(process.env.AWS_PROFILE ? { AWS_PROFILE: process.env.AWS_PROFILE } : {}),
        CLAUDE_CODE_USE_BEDROCK: '1',
        ANTHROPIC_MODEL: process.env.ANTHROPIC_MODEL || 'us.anthropic.claude-sonnet-4-6',
      },
    };

    // We don't send the init payload yet — sendMessage will set the prompt and send it
    // Store it for the first sendMessage call
    (userContainer as unknown as { _initPayload: typeof initPayload })._initPayload = initPayload;
  }

  /**
   * Send a message to the user's running container.
   */
  async sendMessage(
    userId: string,
    message: string,
    onOutput: OutputCallback,
    onSendMessage: SendMessageCallback,
  ): Promise<void> {
    await this.ensureRunning(userId);

    const container = this.containers.get(userId);
    if (!container) throw new Error(`No container for user ${userId}`);

    container.onOutput = onOutput;
    container.onSendMessage = onSendMessage;

    // Check if this is the first message (init payload hasn't been sent yet)
    const initPayload = (container as unknown as { _initPayload?: object })._initPayload;
    if (initPayload) {
      // First message — send init payload with the prompt
      const payload = { ...initPayload, prompt: message };
      container.stdin.write(JSON.stringify(payload) + '\n');
      delete (container as unknown as { _initPayload?: object })._initPayload;
    } else {
      // Follow-up message
      container.stdin.write(JSON.stringify({ type: 'message', text: message }) + '\n');
    }
  }

  /**
   * Stop a user's container gracefully.
   */
  async stop(userId: string): Promise<void> {
    const container = this.containers.get(userId);
    if (!container) return;

    try {
      container.stdin.end(); // Send EOF
      // Give it a moment, then force kill
      setTimeout(() => {
        try {
          execSync(`docker rm -f ${container.name}`, { stdio: 'ignore' });
        } catch { /* already gone */ }
      }, 5000);
    } catch { /* already dead */ }

    this.containers.delete(userId);
  }

  /**
   * Check if a container is alive.
   */
  async isAlive(userId: string): Promise<boolean> {
    const container = this.containers.get(userId);
    if (!container) return false;

    try {
      const output = execSync(
        `docker inspect -f "{{.State.Running}}" ${container.name}`,
        { encoding: 'utf-8', timeout: 3000 },
      ).trim();
      return output === 'true';
    } catch {
      return false;
    }
  }

  // -------------------------------------------------------------------------
  // Stdout parsing — extract sentinel markers in real-time
  // -------------------------------------------------------------------------

  private parseStdout(userId: string, chunk: string): void {
    const container = this.containers.get(userId);
    if (!container) return;

    container.parseBuffer += chunk;

    // Parse send_message sentinels (immediate SSE push)
    while (true) {
      const smStart = container.parseBuffer.indexOf(SEND_MSG_START);
      if (smStart === -1) break;
      const smEnd = container.parseBuffer.indexOf(SEND_MSG_END, smStart);
      if (smEnd === -1) break; // incomplete, wait for more data

      const jsonStr = container.parseBuffer
        .slice(smStart + SEND_MSG_START.length, smEnd)
        .trim();
      container.parseBuffer =
        container.parseBuffer.slice(0, smStart) +
        container.parseBuffer.slice(smEnd + SEND_MSG_END.length);

      try {
        const msg = JSON.parse(jsonStr);
        if (msg.type === 'send_message' && msg.text && container.onSendMessage) {
          container.onSendMessage(msg.text);
        }
      } catch (err) {
        console.error(`[container-runner] Failed to parse send_message: ${err}`);
      }
    }

    // Parse output markers
    while (true) {
      const startIdx = container.parseBuffer.indexOf(OUTPUT_START_MARKER);
      if (startIdx === -1) break;
      const endIdx = container.parseBuffer.indexOf(OUTPUT_END_MARKER, startIdx);
      if (endIdx === -1) break; // incomplete, wait for more data

      const jsonStr = container.parseBuffer
        .slice(startIdx + OUTPUT_START_MARKER.length, endIdx)
        .trim();
      container.parseBuffer =
        container.parseBuffer.slice(0, startIdx) +
        container.parseBuffer.slice(endIdx + OUTPUT_END_MARKER.length);

      try {
        const output: ContainerOutput = JSON.parse(jsonStr);

        // Track session ID
        if (output.newSessionId) {
          sessionStore.set(userId, output.newSessionId, output.lastAssistantUuid).catch(err => {
            console.error(`[container-runner] Failed to save session: ${err}`);
          });
        }

        // Forward to callback
        if (container.onOutput) {
          container.onOutput(output).catch(err => {
            console.error(`[container-runner] Output callback error: ${err}`);
          });
        }
      } catch (err) {
        console.error(`[container-runner] Failed to parse output: ${err}`);
      }
    }
  }
}

export const containerRunner = new ContainerRunner();
