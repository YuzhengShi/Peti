import { Router, Request, Response } from 'express';
import { prisma } from '../db';
import { requireAuth } from '../middleware/requireAuth';

const router = Router();

// POST /api/chat — SSE streaming chat endpoint
// V1 stub: saves messages and streams a placeholder response.
// Will be replaced with real agent container integration.
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

  // Check for pending proactive message
  const userState = await prisma.userState.findUnique({ where: { userId } });
  if (userState?.pendingMessage) {
    send({ type: 'proactive', text: userState.pendingMessage });
    await prisma.userState.update({
      where: { userId },
      data: { pendingMessage: null },
    });
  }

  // V1 stub: generate a placeholder response
  // When the agent container is connected, this block gets replaced with
  // containerLifecycle.sendMessage(userId, message) + stdout streaming.
  const stubResponses = [
    "hey, I heard you.",
    "I'm still getting set up, but I'm here.",
    "once my full self is online, we'll have real conversations — for now, just know I'm listening.",
  ];
  const response = stubResponses[Math.floor(Math.random() * stubResponses.length)];

  // Stream response as sentence events with delays
  const sentences = response.split(/(?<=[.!?])\s+/).filter(Boolean);
  for (let i = 0; i < sentences.length; i++) {
    await new Promise(resolve => setTimeout(resolve, 300));
    send({ type: 'sentence', text: sentences[i] });
  }

  // Save pet response
  await prisma.message.create({
    data: { userId, role: 'pet', content: response, agentType: 'main' },
  });

  send({ type: 'done' });
  res.end();
});

export default router;
