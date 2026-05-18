"use client";

import { Clock, MapPin } from "lucide-react";
import type { HistoryItem } from "@/lib/types";

interface HistoryPanelProps {
  items: HistoryItem[];
  databaseConnected: boolean;
  onSelect?: (item: HistoryItem) => void;
}

export default function HistoryPanel({
  items,
  databaseConnected,
  onSelect,
}: HistoryPanelProps) {
  return (
    <aside className="bg-white rounded-xl border border-stone-200 shadow-sm p-5 h-fit lg:sticky lg:top-24">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="h-4 w-4 text-[#005a32]" />
        <h2 className="font-semibold text-stone-900">Recent Analyses</h2>
      </div>

      {!databaseConnected && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-3 mb-3">
          Database not configured. Analyses will run but history will not be saved.
        </p>
      )}

      {items.length === 0 ? (
        <p className="text-sm text-stone-500">No saved analyses yet.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onSelect?.(item)}
                className="w-full text-left rounded-lg border border-stone-100 hover:border-[#005a32]/40 hover:bg-[#f0f4f1] p-3 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-stone-800 truncate">
                    {item.land_use}
                  </span>
                  <span
                    className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                      item.backend_status === "OK"
                        ? "bg-green-100 text-green-800"
                        : item.backend_status === "NON_ARABLE"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-stone-100 text-stone-600"
                    }`}
                  >
                    {item.backend_status || "—"}
                  </span>
                </div>
                <div className="flex items-center gap-1 mt-1 text-xs text-stone-500">
                  <MapPin className="h-3 w-3 shrink-0" />
                  {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
                </div>
                {item.erosion_risk_level && (
                  <p className="text-xs text-stone-500 mt-1">
                    Erosion: {item.erosion_risk_level}
                  </p>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
