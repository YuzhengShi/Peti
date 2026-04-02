import { Router, Request, Response } from 'express';
import { prisma } from '../db';
import { requireAuth } from '../middleware/requireAuth';

const router = Router();

const VALID_CATEGORIES = ['observation', 'strategy', 'preference', 'milestone'];

// GET /api/memories — paginated list with optional search + category filter (requires auth)
router.get('/', requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string) || 20));
  const skip = (page - 1) * pageSize;
  const search = (req.query.search as string)?.trim();
  const category = req.query.category as string;

  const where: any = { userId, isActive: true };
  if (search) {
    where.content = { contains: search, mode: 'insensitive' };
  }
  if (category && VALID_CATEGORIES.includes(category)) {
    where.category = category;
  }

  const [memories, total] = await Promise.all([
    prisma.memory.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.memory.count({ where }),
  ]);

  return res.json({
    data: memories,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  });
});

// POST /api/memories — create a memory (requires auth)
router.post('/', requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { content, category, importance } = req.body;

  // Server-side validation
  const errors: Record<string, string> = {};
  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    errors.content = 'Content is required';
  } else if (content.length > 2000) {
    errors.content = 'Content must be under 2000 characters';
  }
  if (!category || !VALID_CATEGORIES.includes(category)) {
    errors.category = `Category must be one of: ${VALID_CATEGORIES.join(', ')}`;
  }
  if (importance !== undefined) {
    const imp = Number(importance);
    if (!Number.isInteger(imp) || imp < 1 || imp > 5) {
      errors.importance = 'Importance must be an integer between 1 and 5';
    }
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: errors },
    });
  }

  const memory = await prisma.memory.create({
    data: {
      userId,
      content: content.trim(),
      category,
      importance: importance ? Number(importance) : 1,
    },
  });

  return res.status(201).json({ data: memory });
});

// PUT /api/memories/:id — update a memory (requires auth)
router.put('/:id', requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const id = req.params.id as string;
  const { content, category, importance } = req.body;

  const memory = await prisma.memory.findUnique({ where: { id } });
  if (!memory || memory.userId !== userId) {
    return res.status(404).json({
      error: { code: 'NOT_FOUND', message: 'Memory not found' },
    });
  }

  const errors: Record<string, string> = {};
  if (content !== undefined) {
    if (typeof content !== 'string' || content.trim().length === 0) {
      errors.content = 'Content is required';
    } else if (content.length > 2000) {
      errors.content = 'Content must be under 2000 characters';
    }
  }
  if (category !== undefined && !VALID_CATEGORIES.includes(category)) {
    errors.category = `Category must be one of: ${VALID_CATEGORIES.join(', ')}`;
  }
  if (importance !== undefined) {
    const imp = Number(importance);
    if (!Number.isInteger(imp) || imp < 1 || imp > 5) {
      errors.importance = 'Importance must be an integer between 1 and 5';
    }
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: errors },
    });
  }

  const updated = await prisma.memory.update({
    where: { id },
    data: {
      ...(content !== undefined && { content: content.trim() }),
      ...(category !== undefined && { category }),
      ...(importance !== undefined && { importance: Number(importance) }),
    },
  });

  return res.json({ data: updated });
});

// DELETE /api/memories/:id — soft delete (requires auth)
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const id = req.params.id as string;

  const memory = await prisma.memory.findUnique({ where: { id } });
  if (!memory || memory.userId !== userId) {
    return res.status(404).json({
      error: { code: 'NOT_FOUND', message: 'Memory not found' },
    });
  }

  await prisma.memory.update({
    where: { id },
    data: { isActive: false },
  });

  return res.json({ data: { message: 'Memory deleted' } });
});

export default router;
