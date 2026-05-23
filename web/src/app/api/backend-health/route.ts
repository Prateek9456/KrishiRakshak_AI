import { getBackendUrl, HEALTH_TIMEOUT_MS } from "@/lib/config";

export async function GET() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);

  try {
    const res = await fetch(`${getBackendUrl()}/health`, {
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timeoutId);

    return Response.json(
      {
        status: res.ok ? "ok" : "error",
        backend: res.ok ? "available" : "unavailable",
      },
      { status: res.ok ? 200 : 503 }
    );
  } catch (error) {
    clearTimeout(timeoutId);
    return Response.json(
      {
        status: "error",
        backend: "unavailable",
        message:
          error instanceof Error ? error.message : "Could not reach backend",
      },
      { status: 503 }
    );
  }
}
