import { createHash, randomBytes } from "crypto";
import { prisma } from "./prisma";
import { isDatabaseConfigured } from "./config";

export async function touchUserSession(
  userId: number,
  authProvider: string,
  sessionToken?: string
): Promise<void> {
  if (!isDatabaseConfigured()) return;

  const token = sessionToken || randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const now = new Date();

  const existing = await prisma.user_sessions.findUnique({
    where: { session_token_hash: tokenHash },
  });

  if (existing) {
    await prisma.user_sessions.update({
      where: { id: existing.id },
      data: { last_seen_at: now },
    });
    return;
  }

  await prisma.user_sessions.create({
    data: {
      user_id: userId,
      session_token_hash: tokenHash,
      auth_provider: authProvider,
      started_at: now,
      last_seen_at: now,
    },
  });
}
