import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isDatabaseConfigured } from "@/lib/config";
import { ensureDatabaseObjects } from "@/lib/db-setup";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isDatabaseConfigured()) {
    return Response.json({ items: [], database: false });
  }

  await ensureDatabaseObjects();

  const items = await prisma.analysis_requests.findMany({
    where: { user_id: session.user.id },
    orderBy: { created_at: "desc" },
    take: 5,
    select: {
      id: true,
      latitude: true,
      longitude: true,
      land_use: true,
      backend_status: true,
      erosion_risk_level: true,
      created_at: true,
    },
  });

  return Response.json({
    items: items.map((row) => ({
      ...row,
      created_at: row.created_at.toISOString(),
    })),
    database: true,
  });
}
