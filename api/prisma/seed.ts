import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const adminHash = await bcrypt.hash('Admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@peti.dev' },
    update: { passwordHash: adminHash, role: 'admin' },
    create: {
      email: 'admin@peti.dev',
      username: 'admin',
      passwordHash: adminHash,
      role: 'admin',
    },
  });
  console.log('Admin user created:', admin.email);

  // Create test user
  const userHash = await bcrypt.hash('User1234', 12);
  const user = await prisma.user.upsert({
    where: { email: 'test@peti.dev' },
    update: { passwordHash: userHash },
    create: {
      email: 'test@peti.dev',
      username: 'testuser',
      passwordHash: userHash,
      role: 'user',
    },
  });
  console.log('Test user created:', user.email);

  // Create some sample memories for the test user
  const categories = ['observation', 'strategy', 'preference', 'milestone'] as const;
  const sampleMemories = [
    { content: 'User tends to be more talkative in the evenings', category: 'observation', importance: 2 },
    { content: 'Suggested trying a 10-minute walk before work — follow up next session', category: 'strategy', importance: 3 },
    { content: 'Prefers direct, honest feedback over sugarcoating', category: 'preference', importance: 4 },
    { content: 'Completed first week of consistent journaling', category: 'milestone', importance: 5 },
    { content: 'Mentioned feeling overwhelmed by deadlines this month', category: 'observation', importance: 3 },
    { content: 'Loves lo-fi music — plays it while studying', category: 'preference', importance: 2 },
  ];

  for (const mem of sampleMemories) {
    await prisma.memory.create({
      data: { userId: user.id, ...mem },
    });
  }
  console.log(`Created ${sampleMemories.length} sample memories`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
