export const DEFAULT_BACKEND_URL =
  "https://swc-ai-engine-clean.onrender.com";

export function getBackendUrl(): string {
  return (
    process.env.BACKEND_URL?.replace(/\/$/, "") || DEFAULT_BACKEND_URL
  );
}

export const ANALYZE_TIMEOUT_MS =
  Number(process.env.ANALYZE_TIMEOUT_SECONDS || "240") * 1000;

/** Render free tier cold starts can exceed 30s; allow time to wake. */
export const HEALTH_TIMEOUT_MS =
  Number(process.env.HEALTH_TIMEOUT_SECONDS || "60") * 1000;

export const HEALTH_RETRIES = Number(process.env.HEALTH_RETRIES || "3");

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export function isDemoAuthEnabled(): boolean {
  return process.env.AUTH_MODE === "demo";
}
