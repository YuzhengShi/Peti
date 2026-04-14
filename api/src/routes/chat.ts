import { Router, Request, Response } from 'express';
import { prisma } from '../db';
import { requireAuth } from '../middleware/requireAuth';
import { containerRunner, ContainerOutput } from '../container-runner';
import { profileManager } from '../profile-manager';

const router = Router();

// Active SSE connections per user — used by internal API to push state events
export const activeStreams = new Map<string, {
  send: (event: object) => void;
  res: Response;
}>();

// POST /api/chat — SSE streaming chat endpoint
router.post('/', requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { message } = req.body;

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'Message is required' },
    });
  }

  // Save user message
  await prisma.message.create({
    data: { userId, role: 'user', content: message.trim() },
  });

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const send = (event: object) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  };

  // Register SSE stream for state push events from internal API
  activeStreams.set(userId, { send, res });

  // Flush pending proactive message
  const userState = await prisma.userState.findUnique({ where: { userId } });
  if (userState?.pendingMessage) {
    send({ type: 'proactive', text: userState.pendingMessage });
    await prisma.userState.update({
      where: { userId },
      data: { pendingMessage: null },
    });
  }

  // --- Completion tracking ---
  // After the last output result, wait 2s of silence then send 'done'.
  // Don't start the idle timer until first output arrives (agent needs time to process).
  let closed = false;
  let gotFirstOutput = false;
  let doneTimer: ReturnType<typeof setTimeout> | null = null;

  const hardTimeout = setTimeout(() => finish(), 120_000);

  function resetDoneTimer() {
    gotFirstOutput = true;
    if (doneTimer) clearTimeout(doneTimer);
    doneTimer = setTimeout(() => finish(), 2000);
  }

  function finish() {
    if (closed) return;
    closed = true;
    if (doneTimer) clearTimeout(doneTimer);
    clearTimeout(hardTimeout);

    send({ type: 'done' });
    activeStreams.delete(userId);
    res.end();

    // Sync state from disk after session
    profileManager.syncStateFromDisk(userId).catch(err => {
      console.error(`[chat] Failed to sync state for ${userId}:`, err);
    });
  }

  // Handle client disconnect
  req.on('close', () => {
    if (closed) return;
    closed = true;
    if (doneTimer) clearTimeout(doneTimer);
    clearTimeout(hardTimeout);
    activeStreams.delete(userId);
    profileManager.syncStateFromDisk(userId).catch(() => {});
  });

  // --- Send to agent container ---
  try {
    await containerRunner.sendMessage(
      userId,
      message.trim(),

      // onOutput: called for each OUTPUT_START/END result from the container
      async (output: ContainerOutput) => {
        if (closed) return;

        if (output.status === 'error') {
          send({ type: 'error', message: output.error || 'Agent error' });
          finish();
          return;
        }

        if (output.result) {
          // Split into sentences and stream
          const sentences = output.result
            .split(/(?<=[.!?])\s+/)
            .filter(s => s.trim().length > 0);

          for (const sentence of sentences) {
            send({ type: 'sentence', text: sentence });
          }

          // Save pet response
          await prisma.message.create({
            data: { userId, role: 'pet', content: output.result, agentType: 'main' },
          });
        }

        // Reset the done timer — more output may follow
        resetDoneTimer();
      },

      // onSendMessage: called for immediate send_message tool calls (mid-processing)
      (text: string) => {
        if (closed) return;
        send({ type: 'sentence', text });
        resetDoneTimer();
      },
    );

    // sendMessage returned — container accepted the message.
    // Don't start idle timer yet — wait for first output (agent may take 10+ seconds).
    // Hard timeout (120s) is the safety net.
  } catch (err) {
    console.error(`[chat] Container error for user ${userId}:`, err);
    send({ type: 'error', message: 'Peti got distracted — try again in a moment.' });
    finish();
  }
});

export default router;
