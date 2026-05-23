"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  LogOut,
  MapPin,
  Navigation,
  Loader2,
  Activity
} from "lucide-react";
import Image from "next/image";
import IcarLogo from "@/components/IcarLogo";
import MapLoader from "@/components/MapLoader";
import CoordinateInputs from "@/components/CoordinateInputs";
import AnalysisResults from "@/components/AnalysisResults";
import HistoryPanel from "@/components/HistoryPanel";
import LanguageToggle from "@/components/LanguageToggle";
import { LAND_USE_OPTIONS } from "@/lib/constants";
import type { AnalyzeResponse, HistoryItem } from "@/lib/types";
import { useLanguage } from "@/contexts/LanguageContext";

type LocationMode = "gps" | "pin";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useLanguage();

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

  const [backendOk, setBackendOk] = useState<boolean | null>(null);
  const [healthChecking, setHealthChecking] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [dbConnected, setDbConnected] = useState(true);

  const loadDbStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/db/status");
      const data = await res.json();
      setDbConnected(data.connected === true);
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
      const res = await fetch("/api/backend-health", { cache: "no-store" });
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
      const contentType = res.headers.get("content-type") || "";
      const data: AnalyzeResponse = contentType.includes("application/json")
        ? await res.json()
        : {
            status: "ERROR",
            message:
              "Backend returned a non-JSON response. Please redeploy the backend service with the latest fixes.",
          };
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
    <div className="min-h-screen bg-[#f5f7f5] flex flex-col font-sans">
      <nav className="bg-white/80 backdrop-blur-lg border-b border-stone-200/50 sticky top-0 z-50 shadow-sm transition-all">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-3 text-[#1b5e20] bg-[#2e7d32]/10 px-3 py-2 rounded-xl">
                  <IcarLogo size="xs" />
                  <span className="font-extrabold text-base sm:text-lg tracking-tight hidden sm:block">
                    KrishiRakshak AI
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => checkHealth()}
                disabled={healthChecking}
                title="Click to re-check engine connection"
                className={`hidden lg:flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
                  healthChecking || backendOk === null
                    ? "bg-amber-50 text-amber-800 border-amber-200 shadow-sm"
                    : backendOk
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm hover:bg-emerald-100"
                      : "bg-red-50 text-red-700 border-red-200 shadow-sm hover:bg-red-100"
                }`}
              >
                {healthChecking ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Activity className="h-3 w-3" />
                )}
                {healthChecking
                  ? t.dashboard.wakingEngine
                  : backendOk === null
                    ? t.dashboard.checking
                    : backendOk
                      ? t.dashboard.backendOnline
                      : t.dashboard.backendOffline}
              </button>
            </div>
            <div className="flex items-center gap-4">
              <LanguageToggle />
              
              <div className="h-8 w-px bg-stone-200 hidden sm:block" />
              
              {session.user?.image && (
                <Image
                  src={session.user.image}
                  alt=""
                  width={36}
                  height={36}
                  className="rounded-full ring-2 ring-[#005a32]/20 shadow-sm"
                />
              )}
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-stone-800">
                  {session.user?.name}
                </p>
                <p className="text-xs text-stone-500 font-medium">{session.user?.email}</p>
              </div>
              <button
                type="button"
                onClick={() => signOut()}
                className="text-stone-500 hover:text-red-600 flex items-center gap-1.5 text-sm font-semibold transition-colors ml-2 bg-stone-100 hover:bg-red-50 px-3 py-1.5 rounded-lg"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">{t.dashboard.signOut}</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <section className="relative rounded-2xl p-6 sm:p-12 mb-8 overflow-hidden shadow-lg border border-stone-200/50 group min-h-[400px] flex flex-col justify-center">
          <Image
            src="/images/indian_agriculture_hero.png"
            alt="Indian Agriculture"
            fill
            className="object-cover transition-transform duration-[10000ms] group-hover:scale-105"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/80 to-transparent sm:w-2/3" />
          <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-white/20 to-transparent sm:hidden" />
          
          <div className="relative z-10 max-w-2xl">
            <p className="text-[#005a32] uppercase text-xs font-bold tracking-widest mb-2 flex items-center gap-2">
              <IcarLogo size="xs" />
              {t.dashboard.heroKicker}
            </p>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-stone-900 tracking-tight max-w-2xl leading-tight">
              {t.dashboard.heroTitle}
            </h1>
            <p className="text-stone-600 mt-4 max-w-3xl leading-relaxed font-medium">
              {t.dashboard.heroDesc}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
              <div className="bg-white/80 backdrop-blur border border-stone-200/80 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                <strong className="text-stone-900 block text-sm font-bold">{t.dashboard.step1Title}</strong>
                <span className="text-stone-500 text-sm mt-1 block font-medium">{t.dashboard.step1Desc}</span>
              </div>
              <div className="bg-white/80 backdrop-blur border border-stone-200/80 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                <strong className="text-stone-900 block text-sm font-bold">{t.dashboard.step2Title}</strong>
                <span className="text-stone-500 text-sm mt-1 block font-medium">{t.dashboard.step2Desc}</span>
              </div>
              <div className="bg-white/80 backdrop-blur border border-stone-200/80 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                <strong className="text-stone-900 block text-sm font-bold">{t.dashboard.step3Title}</strong>
                <span className="text-stone-500 text-sm mt-1 block font-medium">{t.dashboard.step3Desc}</span>
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          <div className="xl:col-span-3 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-stone-200/60 shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
                  <div className="bg-[#e8f5e9] p-2 rounded-lg">
                    <MapPin className="h-5 w-5 text-[#2e7d32]" />
                  </div>
                  {t.dashboard.fieldLocation}
                </h2>
                <div className="flex rounded-xl border border-stone-200 p-1 bg-stone-50/50">
                  <button
                    type="button"
                    onClick={() => setLocationMode("gps")}
                    className={`flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-lg transition-all duration-300 ${
                      locationMode === "gps"
                        ? "bg-white text-[#2e7d32] shadow-sm border border-stone-200/50"
                        : "text-stone-500 hover:text-stone-800"
                    }`}
                  >
                    <Navigation className="h-4 w-4" />
                    {t.dashboard.liveGps}
                  </button>
                  <button
                    type="button"
                    onClick={() => setLocationMode("pin")}
                    className={`flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-lg transition-all duration-300 ${
                      locationMode === "pin"
                        ? "bg-white text-[#2e7d32] shadow-sm border border-stone-200/50"
                        : "text-stone-500 hover:text-stone-800"
                    }`}
                  >
                    <MapPin className="h-4 w-4" />
                    {t.dashboard.mapPin}
                  </button>
                </div>
              </div>

              {locationMode === "gps" && (
                <div className="mb-4 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={requestGps}
                    disabled={gpsLoading}
                    className="inline-flex items-center gap-2 text-sm font-bold text-[#005a32] bg-[#f0f4f1] border border-[#005a32]/20 rounded-xl px-4 py-2 hover:bg-[#e6efe9] disabled:opacity-50 transition-colors"
                  >
                    {gpsLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Navigation className="h-4 w-4" />
                    )}
                    {t.dashboard.refreshGps}
                  </button>
                  {gpsError && (
                    <p className="text-sm text-red-600 font-medium">{gpsError}</p>
                  )}
                </div>
              )}

              <p className="text-sm text-[#1b5e20] bg-[#e8f5e9]/60 border border-[#2e7d32]/20 rounded-xl px-4 py-3 mb-4 font-medium leading-relaxed">
                {t.dashboard.accuracyNotice}
              </p>

              {locationMode === "gps" &&
                accuracy != null &&
                accuracy > 30 && (
                  <p className="text-sm text-amber-800 bg-amber-50/80 border border-amber-200/50 rounded-xl px-4 py-3 mb-4 font-medium">
                    {t.dashboard.gpsAccuracyWarning.replace("{accuracy}", accuracy.toFixed(0))}
                  </p>
                )}

              <div className="rounded-xl overflow-hidden shadow-inner border border-stone-200/80">
                <MapLoader
                  lat={lat}
                  lon={lon}
                  flyTo={flyTo}
                  onLocationChange={(newLat, newLon) => {
                    setAccuracy(null);
                    setLocation(
                      newLat,
                      newLon,
                      locationMode === "gps" ? t.dashboard.liveGps : t.dashboard.mapPin
                    );
                  }}
                />
              </div>

              <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div className="bg-stone-50/80 p-4 rounded-xl border border-stone-200/60 shadow-sm">
                  <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                    {t.dashboard.latitude}
                  </span>
                  <p className="font-mono font-bold text-stone-900 mt-1">
                    {lat != null ? lat.toFixed(7) : "—"}
                  </p>
                </div>
                <div className="bg-stone-50/80 p-4 rounded-xl border border-stone-200/60 shadow-sm">
                  <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                    {t.dashboard.longitude}
                  </span>
                  <p className="font-mono font-bold text-stone-900 mt-1">
                    {lon != null ? lon.toFixed(7) : "—"}
                  </p>
                </div>
                <div className="bg-stone-50/80 p-4 rounded-xl border border-stone-200/60 shadow-sm">
                  <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                    {t.dashboard.accuracy}
                  </span>
                  <p className="font-bold text-stone-900 mt-1">
                    {accuracy != null ? `±${accuracy.toFixed(0)} m` : "—"}
                  </p>
                </div>
                <div className="bg-stone-50/80 p-4 rounded-xl border border-stone-200/60 shadow-sm">
                  <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                    {t.dashboard.source}
                  </span>
                  <p className="font-bold text-stone-900 mt-1 truncate">
                    {locationSource || "—"}
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <CoordinateInputs
                  lat={lat}
                  lon={lon}
                  onChange={(newLat, newLon) =>
                    setLocation(newLat, newLon, locationSource || "Manual")
                  }
                />
              </div>
            </div>



            <div className="bg-white p-6 rounded-2xl border border-stone-200/60 shadow-[0_4px_20px_rgb(0,0,0,0.03)] relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-[#2e7d32]" />
              
              <h2 className="text-xl font-bold text-stone-900 mb-6 flex items-center gap-3 pl-2">
                <IcarLogo size="xs" />
                {t.dashboard.landContext}
              </h2>
              
              <div className="pl-2">
                <label
                  htmlFor="land-use"
                  className="block text-sm font-bold text-stone-700 mb-2"
                >
                  {t.dashboard.cropTypeLabel}
                </label>
                <div className="relative">
                  <select
                    id="land-use"
                    value={landUse}
                    onChange={(e) => setLandUse(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-stone-200/80 bg-stone-50/50 py-3.5 pl-4 pr-10 text-sm font-medium text-stone-800 focus:border-[#2e7d32] focus:outline-none focus:ring-2 focus:ring-[#2e7d32]/20 transition-all shadow-sm"
                  >
                    {Object.entries(LAND_USE_OPTIONS).map(([group, options]) => (
                      <optgroup key={group} label={group} className="font-bold text-stone-500">
                        {options.map((opt) => (
                          <option key={opt.code} value={opt.code} className="font-medium text-stone-900">
                            {opt.label}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-stone-500">
                    <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                      <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path>
                    </svg>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAnalyze}
                  disabled={lat == null || lon == null || loading}
                  className="mt-8 w-full group relative overflow-hidden bg-gradient-to-r from-[#1b5e20] to-[#005a32] text-white font-bold py-4 px-4 rounded-xl shadow-md hover:shadow-lg hover:shadow-[#005a32]/20 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <div className="absolute inset-0 bg-white/20 transform translate-x-[-100%] group-hover:translate-x-[100%] transition-all duration-700" />
                  {loading && <Loader2 className="h-5 w-5 animate-spin relative z-10" />}
                  <span className="relative z-10 text-base tracking-wide">
                    {loading ? t.dashboard.analyzingBtn : t.dashboard.analyzeBtn}
                  </span>
                </button>
                
                {backendOk === false && !healthChecking && (
                  <p className="text-xs font-medium text-amber-700 mt-3 text-center bg-amber-50 p-2 rounded-lg border border-amber-100">
                    {t.dashboard.engineWaking}
                  </p>
                )}
                {analyzeError && !result?.status && (
                  <p className="text-sm font-medium text-red-600 mt-4 bg-red-50 p-3 rounded-lg border border-red-100 text-center">
                    {analyzeError}
                  </p>
                )}
              </div>
            </div>

            {result && (
              <AnalysisResults
                result={result}
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
