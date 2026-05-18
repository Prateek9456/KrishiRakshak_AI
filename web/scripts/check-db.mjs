import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
try {
  const users = await prisma.users.count();
  const analyses = await prisma.analysis_requests.count();
  const sessions = await prisma.user_sessions.count();
  console.log(JSON.stringify({ users, analyses, sessions, ok: true }));
} catch (e) {
  console.log(JSON.stringify({ ok: false, error: e.message }));
} finally {
  await prisma.$disconnect();
}
