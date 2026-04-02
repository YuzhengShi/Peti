import { Router, Request, Response } from 'express';
import { prisma } from '../db';
import { requireAuth } from '../middleware/requireAuth';
import { requireRole } from '../middleware/requireRole';

const router = Router();

// All admin routes require auth + admin role
router.use(requireAuth, requireRole('admin'));

// GET /api/admin/users — paginated user list with optional search
router.get('/', async (req: Request, res: Response) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string) || 20));
  const skip = (page - 1) * pageSize;
  const search = (req.query.search as string)?.trim();

  const where: any = {};
  if (search) {
    where.OR = [
      { email: { contains: search, mode: 'insensitive' } },
      { username: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: { id: true, email: true, username: true, role: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.user.count({ where }),
  ]);

  return res.json({
    data: users,
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  });
});

// GET /api/admin/users/:id — single user detail
router.get('/:id', async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true, email: true, username: true, role: true, createdAt: true,
      pet: { select: { id: true, name: true, level: true } },
      _count: { select: { memories: true, messages: true, profileResults: true } },
    },
  });

  if (!user) {
    return res.status(404).json({
      error: { code: 'NOT_FOUND', message: 'User not found' },
    });
  }

  return res.json({ data: user });
});

// PUT /api/admin/users/:id — update user role
router.put('/:id', async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { role } = req.body;

  if (!role || !['user', 'admin'].includes(role)) {
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'Role must be "user" or "admin"' },
    });
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    return res.status(404).json({
      error: { code: 'NOT_FOUND', message: 'User not found' },
    });
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { role },
    select: { id: true, email: true, username: true, role: true, createdAt: true },
  });

  return res.json({ data: updated });
});

// DELETE /api/admin/users/:id — delete user (cascade)
router.delete('/:id', async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const adminId = req.user!.userId;

  if (id === adminId) {
    return res.status(400).json({
      error: { code: 'BAD_REQUEST', message: 'Cannot delete your own account' },
    });
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    return res.status(404).json({
      error: { code: 'NOT_FOUND', message: 'User not found' },
    });
  }

  await prisma.user.delete({ where: { id } });

  return res.json({ data: { message: 'User deleted' } });
});

export default router;
