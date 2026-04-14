import { Router, Request, Response } from 'express';
import { prisma } from '../db';
import { requireAuth } from '../middleware/requireAuth';
import { generateProfile } from '../profile-generator';

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

// POST /api/profiles/generate — trigger LLM profile generation
router.post('/generate', requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.userId;

  const count = await prisma.profileResult.count({ where: { userId } });
  if (count < 6) {
    return res.status(400).json({
      error: { code: 'INCOMPLETE_DATA', message: 'All 6 domains must be completed before generating a profile' },
    });
  }

  try {
    const content = await generateProfile(userId);
    return res.json({ data: { content } });
  } catch (err: any) {
    console.error('Profile generation failed:', err);
    return res.status(500).json({
      error: { code: 'GENERATION_FAILED', message: err.message || 'Profile generation failed' },
    });
  }
});

// GET /api/profiles/content — get the LLM-generated profile content
router.get('/content', requireAuth, async (req: Request, res: Response) => {
  const profile = await prisma.userProfile.findUnique({
    where: { userId: req.user!.userId },
  });

  return res.json({
    data: {
      content: profile?.content || null,
      summary: profile?.summary || null,
      updatedAt: profile?.updatedAt?.toISOString() || null,
    },
  });
});

export default router;
