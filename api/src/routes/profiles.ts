import { Router, Request, Response } from 'express';
import { prisma } from '../db';
import { requireAuth } from '../middleware/requireAuth';

const router = Router();

const VALID_DIMENSIONS = [
  'bigFive', 'attachment', 'personalityFunctioning',
  'dailyFunctioning', 'sleepRegulation', 'emotionRegulation',
];

// POST /api/profiles — upsert a scored domain result
router.post('/', requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { dimensionType, scores, isStable } = req.body;

  if (!dimensionType || !VALID_DIMENSIONS.includes(dimensionType)) {
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: `dimensionType must be one of: ${VALID_DIMENSIONS.join(', ')}` },
    });
  }
  if (!scores || typeof scores !== 'object') {
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'scores object is required' },
    });
  }

  // Check if a previous result exists for trend tracking
  const existing = await prisma.profileResult.findUnique({
    where: { userId_dimensionType: { userId, dimensionType } },
  });

  const result = await prisma.profileResult.upsert({
    where: { userId_dimensionType: { userId, dimensionType } },
    update: {
      previousScores: existing?.scores ?? undefined,
      scores,
      isStable: isStable ?? existing?.isStable ?? true,
    },
    create: {
      userId,
      dimensionType,
      scores,
      isStable: isStable ?? true,
    },
  });

  return res.status(201).json({ data: result });
});

// GET /api/profiles — get all profile results for current user
router.get('/', requireAuth, async (req: Request, res: Response) => {
  const results = await prisma.profileResult.findMany({
    where: { userId: req.user!.userId },
    orderBy: { createdAt: 'asc' },
  });

  return res.json({ data: results });
});

export default router;
