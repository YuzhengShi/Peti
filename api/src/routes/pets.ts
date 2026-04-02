import { Router, Request, Response } from 'express';
import { prisma } from '../db';
import { requireAuth } from '../middleware/requireAuth';

const router = Router();

// POST /api/pets — create pet (one per user)
router.post('/', requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { name, appearance } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 20) {
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'Name must be 2-20 characters' },
    });
  }

  const existing = await prisma.pet.findUnique({ where: { userId } });
  if (existing) {
    return res.status(409).json({
      error: { code: 'CONFLICT', message: 'You already have a pet' },
    });
  }

  const pet = await prisma.pet.create({
    data: {
      userId,
      name: name.trim(),
      appearance: appearance || {},
    },
  });

  return res.status(201).json({ data: pet });
});

// GET /api/pets/mine — get current user's pet
router.get('/mine', requireAuth, async (req: Request, res: Response) => {
  const pet = await prisma.pet.findUnique({ where: { userId: req.user!.userId } });
  if (!pet) {
    return res.status(404).json({
      error: { code: 'NOT_FOUND', message: 'No pet found' },
    });
  }
  return res.json({ data: pet });
});

// PUT /api/pets/:id — update pet
router.put('/:id', requireAuth, async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const pet = await prisma.pet.findUnique({ where: { id } });
  if (!pet || pet.userId !== req.user!.userId) {
    return res.status(404).json({
      error: { code: 'NOT_FOUND', message: 'Pet not found' },
    });
  }

  const { name, appearance } = req.body;
  if (name !== undefined && (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 20)) {
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'Name must be 2-20 characters' },
    });
  }

  const updated = await prisma.pet.update({
    where: { id },
    data: {
      ...(name !== undefined && { name: name.trim() }),
      ...(appearance !== undefined && { appearance }),
    },
  });

  return res.json({ data: updated });
});

export default router;
