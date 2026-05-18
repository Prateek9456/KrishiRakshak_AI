"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  Leaf,
  LogOut,
  MapPin,
  Navigation,
  Loader2,
  Activity,
  Sprout,
} from "lucide-react";
import Image from "next/image";
import MapLoader from "@/components/MapLoader";
import CoordinateInputs from "@/components/CoordinateInputs";
import AnalysisResults from "@/components/AnalysisResults";
import HistoryPanel from "@/components/HistoryPanel";
import { LAND_USE_OPTIONS } from "@/lib/constants";
import type { AnalyzeResponse, HistoryItem } from "@/lib/types";

type LocationMode = "gps" | "pin";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [lat, setLat] = useState<number | null>(null);
  const [lon, setLon] = useState<number | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [locationMode, setLocationMode] = useState<LocationMode>("pin");
  const [locationSource, setLocationSource] = useState<string>("");
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [flyTo, setFlyTo] = useState<{
    lat: number;
    lon: number;
    zoom?: number;
  } | null>(null);

  const [landUse, setLandUse] = useState("WHEAT");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [showRaw, setShowRaw] = useState(false);

  const [backendOk, setBackendOk] = useState<boolean | null>(null);
  const [healthChecking, setHealthChecking] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [dbConnected, setDbConnected] = useState(true);
  const [dbStats, setDbStats] = useState<{
    users: number;
    analyses: number;
  } | null>(null);

  const loadDbStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/db/status");
      const data = await res.json();
      setDbConnected(data.connected === true);
      if (data.stats) {
        setDbStats({
          users: data.stats.users,
          analyses: data.stats.analyses,
        });
      }
    } catch {
      setDbConnected(false);
    }
  }, []);

  const loadHistory = useCallback(async () => {
    try {
      const res = await fetch("/api/history");
      if (!res.ok) return;
      const data = await res.json();
      setHistory(data.items || []);
      setDbConnected(data.database !== false);
    } catch {
      /* ignore */
    }
  }, []);

  const checkHealth = useCallback(async () => {
    setHealthChecking(true);
    try {
      const res = await fetch("/api/health", { cache: "no-store" });
      setBackendOk(res.ok);
    } catch {
      setBackendOk(false);
    } finally {
      setHealthChecking(false);
    }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      checkHealth();
      loadHistory();
      loadDbStatus();
      const interval = setInterval(checkHealth, 60_000);
      return () => clearInterval(interval);
    }
  }, [status, checkHealth, loadHistory, loadDbStatus]);

  const setLocation = (newLat: number, newLon: number, source: string) => {
    const roundedLat = Math.round(newLat * 1e7) / 1e7;
    const roundedLon = Math.round(newLon * 1e7) / 1e7;
    setLat(roundedLat);
    setLon(roundedLon);
    setLocationSource(source);
    setFlyTo({ lat: roundedLat, lon: roundedLon, zoom: 17 });
  };

  const requestGps = () => {
    if (!navigator.geolocation) {
      setGpsError("Geolocation is not supported in this browser.");
      return;
    }
    setGpsLoading(true);
    setGpsError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setAccuracy(pos.coords.accuracy);
        setLocation(pos.coords.latitude, pos.coords.longitude, "Live GPS");
        setGpsLoading(false);
      },
      (err) => {
        setGpsError(err.message || "Could not access GPS.");
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15_000 }
    );
  };

  useEffect(() => {
    if (locationMode === "gps") {
      requestGps();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationMode]);

  const handleAnalyze = async () => {
    if (lat == null || lon == null) return;
    setLoading(true);
    setResult(null);
    setAnalyzeError(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat, lon, land_use: landUse }),
      });
      const data: AnalyzeResponse = await res.json();
      if (!res.ok) {
        setAnalyzeError(data.message || "Analysis request failed.");
        setResult(data);
      } else {
        setResult(data);
        loadHistory();
      }
    } catch {
      setAnalyzeError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleHistorySelect = (item: HistoryItem) => {
    setLandUse(item.land_use);
    setLocation(item.latitude, item.longitude, "History");
    setLocationMode("pin");
  };

  if (status !== "authenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f7f5]">
        <Loader2 className="h-8 w-8 animate-spin text-[#005a32]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f7f5] flex flex-col">
      <nav className="bg-white border-b border-stone-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3">
                <Image
                  src="/images/icar-logo.svg"
                  alt="ICAR"
                  width={120}
                  height={36}
                  className="h-8 w-auto hidden md:block"
                />
                <div className="flex items-center gap-2 text-[#1b5e20]">
                  <Leaf className="h-6 w-6 md:hidden" />
                  <span className="font-bold text-base sm:text-lg tracking-tight">
                    SWC-AI-ENGINE
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => checkHealth()}
                disabled={healthChecking}
                title="Click to re-check engine connection"
                className={`hidden sm:flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border transition-colors ${
                  healthChecking || backendOk === null
                    ? "bg-amber-50 text-amber-800 border-amber-200"
                    : backendOk
                      ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                      : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                }`}
              >
                {healthChecking ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Activity className="h-3 w-3" />
                )}
                {healthChecking
                  ? "Waking engine…"
                  : backendOk === null
                    ? "Checking…"
                    : backendOk
                      ? "Backend online"
                      : "Backend offline — retry"}
              </button>
            </div>
            <div className="flex items-center gap-3">
              {session.user?.image && (
                <Image
                  src={session.user.image}
                  alt=""
                  width={32}
                  height={32}
                  className="rounded-full ring-2 ring-[#005a32]/20"
                />
              )}
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-stone-800">
                  {session.user?.name}
                </p>
                <p className="text-xs text-stone-500">{session.user?.email}</p>
              </div>
              <button
                type="button"
                onClick={() => signOut()}
                className="text-stone-500 hover:text-stone-700 flex items-center gap-1 text-sm font-medium transition-colors ml-1"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <section className="swc-hero mb-8">
          <p className="swc-kicker">Soil & Water Conservation</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#003e21] tracking-tight">
            Field intelligence for ICAR-aligned erosion control
          </h1>
          <p className="text-stone-600 mt-2 max-w-3xl leading-relaxed">
            Capture live GPS or drop a map pin, select your crop or land-cover
            type, and receive conservation measures backed by your SWC analysis
            engine.
          </p>
          <div className="swc-grid mt-5">
            <div className="swc-step">
              <strong>1. Locate</strong>
              <span>Use GPS or click the map to set coordinates.</span>
            </div>
            <div className="swc-step">
              <strong>2. Context</strong>
              <span>Select crop or land-cover from ICAR categories.</span>
            </div>
            <div className="swc-step">
              <strong>3. Analyze</strong>
              <span>Get erosion risk and recommended measures.</span>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          <div className="xl:col-span-3 space-y-6">
            <div className="bg-white p-5 sm:p-6 rounded-xl border border-stone-200 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <h2 className="text-lg font-semibold text-stone-900 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-[#005a32]" />
                  Field Location
                </h2>
                <div className="flex rounded-lg border border-stone-200 p-0.5 bg-stone-50">
                  <button
                    type="button"
                    onClick={() => setLocationMode("gps")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      locationMode === "gps"
                        ? "bg-white text-[#005a32] shadow-sm"
                        : "text-stone-600 hover:text-stone-900"
                    }`}
                  >
                    <Navigation className="h-4 w-4" />
                    Live GPS
                  </button>
                  <button
                    type="button"
                    onClick={() => setLocationMode("pin")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      locationMode === "pin"
                        ? "bg-white text-[#005a32] shadow-sm"
                        : "text-stone-600 hover:text-stone-900"
                    }`}
                  >
                    <MapPin className="h-4 w-4" />
                    Map Pin
                  </button>
                </div>
              </div>

              {locationMode === "gps" && (
                <div className="mb-4 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={requestGps}
                    disabled={gpsLoading}
                    className="inline-flex items-center gap-2 text-sm font-medium text-[#005a32] border border-[#005a32]/30 rounded-md px-3 py-1.5 hover:bg-[#f0f4f1] disabled:opacity-50"
                  >
                    {gpsLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Navigation className="h-4 w-4" />
                    )}
                    Refresh GPS
                  </button>
                  {gpsError && (
                    <p className="text-sm text-red-600">{gpsError}</p>
                  )}
                </div>
              )}

              <p className="text-sm text-[#1b5e20] bg-[#f0f7f2] border border-[#005a32]/20 rounded-md px-3 py-2 mb-3">
                <strong>Accuracy:</strong> Zoom to level 17+ (field scale). Use{" "}
                <strong>Street (reference)</strong> to align your pin, then
                switch to satellite if needed. Drag the pin for fine adjustment.
                Browser GPS is often ±30–100 m — prefer map pin for ICAR plots.
              </p>

              {locationMode === "gps" &&
                accuracy != null &&
                accuracy > 30 && (
                  <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 mb-3">
                    GPS accuracy is ±{accuracy.toFixed(0)} m. For reliable
                    results, switch to <strong>Map Pin</strong> and place the
                    field center manually.
                  </p>
                )}

              <MapLoader
                lat={lat}
                lon={lon}
                flyTo={flyTo}
                onLocationChange={(newLat, newLon) => {
                  setAccuracy(null);
                  setLocation(
                    newLat,
                    newLon,
                    locationMode === "gps" ? "Live GPS" : "Map Pin"
                  );
                }}
              />

              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div className="bg-stone-50 p-3 rounded-lg border border-stone-100">
                  <span className="text-xs font-semibold text-stone-500 uppercase">
                    Latitude
                  </span>
                  <p className="font-mono font-medium text-stone-900 mt-0.5">
                    {lat != null ? lat.toFixed(7) : "—"}
                  </p>
                </div>
                <div className="bg-stone-50 p-3 rounded-lg border border-stone-100">
                  <span className="text-xs font-semibold text-stone-500 uppercase">
                    Longitude
                  </span>
                  <p className="font-mono font-medium text-stone-900 mt-0.5">
                    {lon != null ? lon.toFixed(7) : "—"}
                  </p>
                </div>
                <div className="bg-stone-50 p-3 rounded-lg border border-stone-100">
                  <span className="text-xs font-semibold text-stone-500 uppercase">
                    Accuracy
                  </span>
                  <p className="font-medium text-stone-900 mt-0.5">
                    {accuracy != null ? `±${accuracy.toFixed(0)} m` : "—"}
                  </p>
                </div>
                <div className="bg-stone-50 p-3 rounded-lg border border-stone-100">
                  <span className="text-xs font-semibold text-stone-500 uppercase">
                    Source
                  </span>
                  <p className="font-medium text-stone-900 mt-0.5 truncate">
                    {locationSource || "—"}
                  </p>
                </div>
              </div>

              <CoordinateInputs
                lat={lat}
                lon={lon}
                onChange={(newLat, newLon) =>
                  setLocation(newLat, newLon, locationSource || "Manual")
                }
              />
            </div>

            {dbConnected && dbStats && (
              <p className="text-xs text-green-800 bg-green-50 border border-green-200 rounded-md px-3 py-2">
                MySQL connected — {dbStats.users} user(s), {dbStats.analyses}{" "}
                saved analyses. View in Workbench:{" "}
                <code className="font-mono">swc_ai_engine.analysis_history_view</code>
              </p>
            )}
            {!dbConnected && (
              <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                MySQL not reachable. Check DATABASE_URL in web/.env and run{" "}
                <code className="font-mono">npm run db:check</code>
              </p>
            )}

            <div className="bg-white p-5 sm:p-6 rounded-xl border border-stone-200 shadow-sm">
              <h2 className="text-lg font-semibold text-stone-900 mb-4 flex items-center gap-2">
                <Sprout className="h-5 w-5 text-[#005a32]" />
                Land Context & Analysis
              </h2>
              <label
                htmlFor="land-use"
                className="block text-sm font-medium text-stone-700 mb-2"
              >
                Crop or land-cover type
              </label>
              <select
                id="land-use"
                value={landUse}
                onChange={(e) => setLandUse(e.target.value)}
                className="w-full rounded-md border border-stone-300 py-2.5 pl-3 pr-10 text-sm focus:border-[#005a32] focus:outline-none focus:ring-1 focus:ring-[#005a32]"
              >
                {Object.entries(LAND_USE_OPTIONS).map(([group, options]) => (
                  <optgroup key={group} label={group}>
                    {options.map((opt) => (
                      <option key={opt.code} value={opt.code}>
                        {opt.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>

              <button
                type="button"
                onClick={handleAnalyze}
                disabled={lat == null || lon == null || loading}
                className="mt-6 w-full bg-[#005a32] text-white font-semibold py-3 px-4 rounded-md shadow-sm hover:bg-[#003e21] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? "Analyzing field…" : "Analyze Land"}
              </button>
              {backendOk === false && !healthChecking && (
                <p className="text-xs text-amber-700 mt-2 text-center">
                  Engine may be waking up (Render free tier). You can still
                  analyze — first run may take 1–2 minutes. Click the status
                  badge above to retry.
                </p>
              )}
              {analyzeError && !result?.status && (
                <p className="text-sm text-red-600 mt-3">{analyzeError}</p>
              )}
            </div>

            {result && (
              <AnalysisResults
                result={result}
                showRaw={showRaw}
                onToggleRaw={() => setShowRaw((v) => !v)}
              />
            )}
          </div>

          <div className="xl:col-span-1">
            <HistoryPanel
              items={history}
              databaseConnected={dbConnected}
              onSelect={handleHistorySelect}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
