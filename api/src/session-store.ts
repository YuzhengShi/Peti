/**
 * Session Store — persists Agent SDK session IDs per user.
 * Used for --resume on container restart.
 */

import { prisma } from './db';

class SessionStore {
  // In-memory cache for lastAssistantUuid (not in DB — only needed while container is alive)
  private resumePoints = new Map<string, string>();

  async get(userId: string): Promise<string | null> {
    const session = await prisma.session.findUnique({ where: { userId } });
    return session?.sessionId ?? null;
  }

  getResumePoint(userId: string): string | undefined {
    return this.resumePoints.get(userId);
  }

  async set(userId: string, sessionId: string, lastAssistantUuid?: string): Promise<void> {
    await prisma.session.upsert({
      where: { userId },
      update: { sessionId, updatedAt: new Date() },
      create: { userId, sessionId },
    });
    if (lastAssistantUuid) {
      this.resumePoints.set(userId, lastAssistantUuid);
    }
  }

  async markStale(userId: string): Promise<void> {
    await prisma.session.deleteMany({ where: { userId } });
    this.resumePoints.delete(userId);
  }
}

export const sessionStore = new SessionStore();
