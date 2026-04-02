import { Router, Request, Response } from 'express';
import { prisma } from '../db';
import { requireAuth } from '../middleware/requireAuth';

const router = Router();

// GET /api/messages — paginated message history
router.get('/', requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string) || 50));
  const skip = (page - 1) * pageSize;

  const [messages, total] = await Promise.all([
    prisma.message.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      skip,
      take: pageSize,
    }),
    prisma.message.count({ where: { userId } }),
  ]);

  return res.json({
    data: messages,
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  });
});

// DELETE /api/messages/:id — delete a message
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const msg = await prisma.message.findUnique({ where: { id } });
  if (!msg || msg.userId !== req.user!.userId) {
    return res.status(404).json({
      error: { code: 'NOT_FOUND', message: 'Message not found' },
    });
  }

  await prisma.message.delete({ where: { id } });

  return res.json({ data: { message: 'Message deleted' } });
});

export default router;
