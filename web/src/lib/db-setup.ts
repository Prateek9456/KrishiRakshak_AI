import { prisma } from "./prisma";

const HISTORY_VIEW_SQL = `
CREATE OR REPLACE VIEW analysis_history_view AS
SELECT
    ar.id AS analysis_id,
    u.id AS user_id,
    u.google_sub AS google_login_id,
    u.email AS user_email,
    u.name AS user_name,
    ar.latitude AS access_latitude,
    ar.longitude AS access_longitude,
    ar.land_use AS land_use,
    ar.recommendation_mode AS recommendation_mode,
    ar.recommended_measures AS erosion_control_measures,
    ar.erosion_risk_level AS erosion_risk_level,
    ar.erosion_risk_score AS erosion_risk_score,
    ar.backend_status AS backend_status,
    ar.created_at AS analyzed_at
FROM analysis_requests ar
JOIN users u ON u.id = ar.user_id
`;

export async function ensureDatabaseObjects(): Promise<void> {
  await prisma.$executeRawUnsafe(HISTORY_VIEW_SQL);
}

export async function getDatabaseStats() {
  const [users, analyses, sessions] = await Promise.all([
    prisma.users.count(),
    prisma.analysis_requests.count(),
    prisma.user_sessions.count(),
  ]);
  return { users, analyses, sessions };
}
