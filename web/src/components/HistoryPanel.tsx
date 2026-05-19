"use client";

import { Clock, MapPin } from "lucide-react";
import type { HistoryItem } from "@/lib/types";
import { useLanguage } from "@/contexts/LanguageContext";

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
  const { t } = useLanguage();

  return (
    <aside className="bg-white rounded-2xl border border-stone-200/60 shadow-[0_4px_20px_rgb(0,0,0,0.03)] p-6 h-fit lg:sticky lg:top-24">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-[#e8f5e9] p-2 rounded-lg">
          <Clock className="h-5 w-5 text-[#2e7d32]" />
        </div>
        <h2 className="text-xl font-bold text-stone-900">{t.history.title}</h2>
      </div>

      {!databaseConnected && (
        <p className="text-xs font-medium text-amber-700 bg-amber-50/80 border border-amber-200/50 rounded-xl p-4 mb-4 shadow-sm">
          {t.history.dbOffline}
        </p>
      )}

      {items.length === 0 ? (
        <p className="text-sm font-medium text-stone-500 bg-stone-50 p-4 rounded-xl text-center border border-stone-100">
          {t.history.noHistory}
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onSelect?.(item)}
                className="w-full text-left rounded-xl border border-stone-200/60 hover:border-[#2e7d32]/40 hover:shadow-md hover:bg-white bg-stone-50/50 p-4 transition-all duration-300 group"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-sm font-bold text-stone-800 truncate group-hover:text-[#2e7d32] transition-colors">
                    {item.land_use}
                  </span>
                  <span
                    className={`text-[10px] font-extrabold uppercase px-2 py-1 rounded-md tracking-wider ${
                      item.backend_status === "OK"
                        ? "bg-emerald-100 text-emerald-800"
                        : item.backend_status === "NON_ARABLE"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-stone-200 text-stone-700"
                    }`}
                  >
                    {item.backend_status || "—"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-2 text-xs font-medium text-stone-500 bg-white border border-stone-100 py-1.5 px-2 rounded-lg w-fit">
                  <MapPin className="h-3 w-3 shrink-0 text-stone-400" />
                  {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
                </div>
                {item.erosion_risk_level && (
                  <p className="text-xs font-semibold text-stone-600 mt-3 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
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
