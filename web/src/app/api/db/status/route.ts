import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/config";
import { ensureDatabaseObjects, getDatabaseStats } from "@/lib/db-setup";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isDatabaseConfigured()) {
    return Response.json({
      connected: false,
      message: "DATABASE_URL is not set in web/.env",
    });
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
    await ensureDatabaseObjects();
    const stats = await getDatabaseStats();

    const parsed = new URL(process.env.DATABASE_URL || "");
    return Response.json({
      connected: true,
      database: parsed.pathname?.replace("/", "") || "unknown",
      host: parsed.hostname || "localhost",
      stats,
      tables: ["users", "user_sessions", "analysis_requests"],
      view: "analysis_history_view",
      workbenchHint:
        "In MySQL Workbench: Schemas → swc_ai_engine → Tables (users, analysis_requests) or Views → analysis_history_view → Select Rows",
    });
  } catch (error) {
    return Response.json(
      {
        connected: false,
        message: error instanceof Error ? error.message : "Connection failed",
      },
      { status: 503 }
    );
  }
}
