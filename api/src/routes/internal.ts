/**
 * Internal API routes — called by MCP tools from agent containers.
 * Auth: x-internal-secret header (server-to-server only).
 *
 * POST /api/internal/pet-state  — update pet state (mood, energy, animation, etc.)
 * POST /api/internal/memory     — create a new memory
 * GET  /api/internal/memory     — query memories (semantic search)
 * POST /api/internal/profile    — update user profile
 */

import { Router, Request, Response } from 'express';
import { prisma } from '../db';
import { requireInternal } from '../middleware/requireInternal';
import { activeStreams } from './chat';

const router = Router();

// All routes require internal secret
router.use(requireInternal);

// ---- POST /pet-state ----
// Updates UserState + pushes SSE state event for mood/animation changes
router.post('/pet-state', async (req: Request, res: Response) => {
  const { userId, field, value } = req.body;

  if (!userId || !field || value === undefined) {
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'userId, field, and value are required' },
    });
  }

  // Map field names to UserState columns
  const fieldMap: Record<string, string> = {
    mood: 'mood',
    energy: 'energy',
    animation: 'animation',
    pending_proactive_message: 'pendingMessage',
  };

  const dbField = fieldMap[field];
  if (dbField) {
    await prisma.userState.upsert({
      where: { userId },
      update: { [dbField]: value },
      create: {
        userId,
        mood: field === 'mood' ? value : 'content',
        energy: field === 'energy' ? value : 'moderate',
        animation: field === 'animation' ? value : 'idle',
        ...(field === 'pending_proactive_message' ? { pendingMessage: value || null } : {}),
      },
    });
  }

  // Push SSE state event for real-time sprite updates
  if (['mood', 'energy', 'animation'].includes(field)) {
    const stream = activeStreams.get(userId);
    if (stream) {
      // Fetch full state to send complete state event
      const state = await prisma.userState.findUnique({ where: { userId } });
      if (state) {
        stream.send({
          type: 'state',
          mood: state.mood,
          energy: state.energy,
          animation: state.animation,
        });
      }
    }
  }

  return res.json({ data: { success: true } });
});

// ---- POST /memory ----
// Create a new memory (called by memory_create MCP tool)
router.post('/memory', async (req: Request, res: Response) => {
  const { userId, content, category, importance } = req.body;

  if (!userId || !content || !category) {
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'userId, content, and category are required' },
    });
  }

  const validCategories = ['observation', 'strategy', 'preference', 'milestone'];
  if (!validCategories.includes(category)) {
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: `Invalid category. Must be: ${validCategories.join(', ')}` },
    });
  }

  const memory = await prisma.memory.create({
    data: {
      userId,
      content,
      category,
      importance: importance || 1,
      // embedding: will be set when pgvector is implemented
    },
  });

  // If milestone memory, increment pet level
  if (category === 'milestone' && importance >= 4) {
    await prisma.pet.updateMany({
      where: { userId },
      data: { level: { increment: 1 } },
    });
  }

  return res.json({ data: { id: memory.id } });
});

// ---- GET /memory ----
// Query memories (called by memory_query MCP tool)
// For now uses keyword search. Will use pgvector semantic search later.
router.get('/memory', async (req: Request, res: Response) => {
  const userId = req.query.userId as string;
  const q = req.query.q as string;
  const limit = Math.min(parseInt(req.query.limit as string || '5', 10), 20);

  if (!userId) {
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'userId is required' },
    });
  }

  // TODO: Replace with pgvector semantic search when embeddings are set up
  // For now, use basic keyword search with importance-weighted ordering
  const where: Record<string, unknown> = {
    userId,
    isActive: true,
  };

  if (q) {
    where.content = { contains: q, mode: 'insensitive' };
  }

  const memories = await prisma.memory.findMany({
    where,
    orderBy: [
      { importance: 'desc' },
      { createdAt: 'desc' },
    ],
    take: limit,
    select: {
      id: true,
      content: true,
      category: true,
      importance: true,
      createdAt: true,
    },
  });

  return res.json({ data: { memories } });
});

// ---- POST /profile ----
// Update user profile (called by profile_update MCP tool)
router.post('/profile', async (req: Request, res: Response) => {
  const { userId, field, value, note, content } = req.body;

  if (!userId || !field || !value) {
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'userId, field, and value are required' },
    });
  }

  // Update UserProfile content if provided
  if (content) {
    await prisma.userProfile.upsert({
      where: { userId },
      update: { content },
      create: { userId, content },
    });
  }

  // Handle relationship_stage advancement → increment Pet.level + push spriteSheet
  if (field === 'relationship_stage') {
    const stageOrder = ['stranger', 'acquaintance', 'companion', 'deep_bond'];
    const newStageIdx = stageOrder.indexOf(value);

    if (newStageIdx > 0) {
      const pet = await prisma.pet.findFirst({ where: { userId } });
      if (pet && newStageIdx + 1 > pet.level) {
        // Advance level
        await prisma.pet.update({
          where: { id: pet.id },
          data: { level: newStageIdx + 1 },
        });

        // Push sprite sheet swap via SSE
        const spriteMap: Record<number, string> = {
          2: '/sprites/pet-baby.png',
          3: '/sprites/pet-evolved.png',
          4: '/sprites/pet-fully-evolved.png',
        };

        const stream = activeStreams.get(userId);
        if (stream && spriteMap[newStageIdx + 1]) {
          stream.send({
            type: 'state',
            spriteSheet: spriteMap[newStageIdx + 1],
          });
        }
      }
    }
  }

  return res.json({ data: { success: true } });
});

export default router;
