import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ANALYZE_TIMEOUT_MS, getBackendUrl, isDatabaseConfigured } from "@/lib/config";
import type { Prisma } from "@prisma/client";
import type { AnalyzeResponse } from "@/lib/types";

async function fetchAnalyze(
  url: string,
  body: object,
  signal: AbortSignal
): Promise<Response> {
  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { lat, lon, land_use } = body;

    if (lat == null || lon == null || !land_use) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    const analyzeUrl = `${getBackendUrl()}/analyze`;
    const payload = { lat, lon, land_use };

    let backendRes: Response | null = null;
    let lastError: unknown;

    for (let attempt = 0; attempt < 2; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), ANALYZE_TIMEOUT_MS);

      try {
        backendRes = await fetchAnalyze(analyzeUrl, payload, controller.signal);
        clearTimeout(timeoutId);
        break;
      } catch (error) {
        clearTimeout(timeoutId);
        lastError = error;
        const isTimeout =
          error instanceof Error &&
          (error.name === "AbortError" || error.message.includes("aborted"));
        if (!isTimeout || attempt === 1) {
          return Response.json(
            {
              status: "ERROR",
              message: isTimeout
                ? "Analysis timed out. The backend may still be waking up — please try again."
                : "Could not reach the analysis backend.",
            },
            { status: 503 }
          );
        }
      }
    }

    if (!backendRes) {
      return Response.json(
        { status: "ERROR", message: String(lastError) },
        { status: 503 }
      );
    }

    let data: AnalyzeResponse;
    try {
      data = await backendRes.json();
    } catch {
      return Response.json(
        { status: "ERROR", message: "Invalid response from backend." },
        { status: 502 }
      );
    }

    if (!backendRes.ok) {
      return Response.json(
        data.status
          ? data
          : { status: "ERROR", message: data.message || "Backend analysis failed" },
        { status: backendRes.status }
      );
    }

    const userId = session.user.id;
    if (userId && isDatabaseConfigured()) {
      const measures = data.mechanical_measures || {};
      const erosion = data.erosion_risk || {};

      try {
        await prisma.analysis_requests.create({
          data: {
            user_id: userId,
            latitude: lat,
            longitude: lon,
            land_use,
            backend_status: data.status,
            recommendation_mode: measures.mode || null,
            recommended_measures: measures.measures ?? undefined,
            erosion_risk_level: erosion.level || null,
            erosion_risk_score: erosion.score ?? null,
            response_json: JSON.parse(JSON.stringify(data)) as Prisma.InputJsonValue,
            created_at: new Date(),
          },
        });
      } catch (dbError) {
        console.error("Failed to save analysis history:", dbError);
      }
    }

    return Response.json(data);
  } catch (error) {
    console.error("Analysis Error:", error);
    return Response.json(
      { status: "ERROR", message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
