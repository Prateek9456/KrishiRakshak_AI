"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import type { AnalyzeResponse } from "@/lib/types";

interface AnalysisResultsProps {
  result: AnalyzeResponse;
  showRaw: boolean;
  onToggleRaw: () => void;
}

export default function AnalysisResults({
  result,
  showRaw,
  onToggleRaw,
}: AnalysisResultsProps) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      {result.status === "NON_ARABLE" ? (
        <div className="bg-white rounded-xl border border-[#d97706] shadow-md overflow-hidden">
          <div className="border-l-8 border-[#d97706] p-6 sm:p-8">
            <span className="text-sm font-bold text-[#d97706] uppercase tracking-wider">
              Analysis Complete
            </span>
            <h2 className="text-2xl font-bold text-stone-900 mt-1 mb-3">
              Non-Arable Land Detected
            </h2>
            <p className="text-stone-600 text-lg">
              The SWC-AI-ENGINE is calibrated for arable agricultural land. The
              selected context indicates{" "}
              <strong>{result.reason || "non-arable land"}</strong>.
            </p>
          </div>
        </div>
      ) : result.status === "OK" ? (
        <div className="bg-white rounded-xl border border-[#005a32] shadow-md overflow-hidden">
          <div className="border-l-8 border-[#005a32] p-6 sm:p-8">
            <span className="text-sm font-bold text-[#005a32] uppercase tracking-wider">
              Recommended Conservation Measure
            </span>
            <h2 className="text-3xl font-bold text-[#003e21] mt-2 mb-4">
              {result.mechanical_measures?.measures?.[0] ||
                "No specific mechanical measure required."}
            </h2>
            <div className="flex flex-wrap gap-3">
              <span className="inline-flex items-center rounded-md bg-green-50 px-3 py-1 text-sm font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                Risk: {result.erosion_risk?.level || "Unknown"}
              </span>
              <span className="inline-flex items-center rounded-md bg-stone-50 px-3 py-1 text-sm font-medium text-stone-600 ring-1 ring-inset ring-stone-500/10">
                Score: {result.erosion_risk?.score ?? "—"}
              </span>
              {result.mechanical_measures?.mode && (
                <span className="inline-flex items-center rounded-md bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20">
                  Mode: {result.mechanical_measures.mode}
                </span>
              )}
            </div>

            {(result.mechanical_measures?.measures?.length ?? 0) > 1 && (
              <div className="mt-6 border-t border-stone-100 pt-6">
                <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider mb-3">
                  Alternative Measures
                </h3>
                <ul className="list-disc pl-5 text-stone-600 space-y-1">
                  {result.mechanical_measures!.measures!.slice(1).map((m) => (
                    <li key={m}>{m}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                {
                  label: "Rainfall",
                  value: `${result.factors?.rainfall_mm ?? 0} mm`,
                },
                {
                  label: "Slope",
                  value: `${result.factors?.slope_percent ?? 0}%`,
                },
                {
                  label: "Soil Depth",
                  value: result.factors?.soil_depth || "Unknown",
                },
                {
                  label: "Drainage",
                  value: result.factors?.drainage || "Unknown",
                },
              ].map((metric) => (
                <div
                  key={metric.label}
                  className="bg-stone-50 p-3 rounded-lg border border-stone-100"
                >
                  <div className="text-xs font-semibold text-stone-500 uppercase">
                    {metric.label}
                  </div>
                  <div className="text-lg font-bold text-stone-900 capitalize">
                    {metric.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-xl">
          <strong>Error:</strong>{" "}
          {result.message || "An unexpected error occurred."}
        </div>
      )}

      <div className="mt-4">
        <button
          type="button"
          onClick={onToggleRaw}
          className="flex items-center gap-2 text-sm font-medium text-stone-500 hover:text-stone-700 transition-colors"
        >
          {showRaw ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
          {showRaw ? "Hide Developer Details" : "View Detailed Technical Analysis"}
        </button>
        {showRaw && (
          <div className="mt-3 p-4 bg-stone-900 rounded-lg overflow-x-auto">
            <pre className="text-xs text-green-400 font-mono">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}


