import {
  getBackendUrl,
  HEALTH_RETRIES,
  HEALTH_TIMEOUT_MS,
} from "@/lib/config";

async function pingBackend(): Promise<boolean> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);

  try {
    const res = await fetch(`${getBackendUrl()}/health`, {
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timeoutId);
    return res.ok;
  } catch {
    clearTimeout(timeoutId);
    return false;
  }
}

export async function GET() {
  for (let attempt = 1; attempt <= HEALTH_RETRIES; attempt++) {
    const ok = await pingBackend();
    if (ok) {
      return Response.json({
        status: "ok",
        backend: "available",
        attempts: attempt,
      });
    }
    if (attempt < HEALTH_RETRIES) {
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  return Response.json(
    {
      status: "error",
      backend: "unavailable",
      message:
        "Could not reach the analysis engine. On Render free tier, the first request after idle can take 1–2 minutes.",
    },
    { status: 503 }
  );
}
