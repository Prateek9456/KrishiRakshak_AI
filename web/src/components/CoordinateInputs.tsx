"use client";

import { useLanguage } from "@/contexts/LanguageContext";

interface CoordinateInputsProps {
  lat: number | null;
  lon: number | null;
  onChange: (lat: number, lon: number) => void;
}

function parseCoord(value: string): number | null {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : null;
}

export default function CoordinateInputs({
  lat,
  lon,
  onChange,
}: CoordinateInputsProps) {
  const { t, language } = useLanguage();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 p-4 rounded-xl border border-[#2e7d32]/20 bg-[#e8f5e9]/50 shadow-inner">
      <p className="sm:col-span-2 text-xs text-[#1b5e20] font-medium leading-relaxed">
        {language === "hi"
          ? "निर्देशांकों को ठीक करें (7 दशमलव स्थान ≈ 1 सेमी)। पिन को खींचें या सटीक मान टाइप करें — सटीक आईसीएआर क्षेत्र विश्लेषण के लिए आवश्यक है।"
          : "Fine-tune coordinates (7 decimal places ≈ 1 cm). Drag the pin or type exact values — required for accurate ICAR field analysis."}
      </p>
      <div>
        <label className="block text-[10px] font-extrabold text-stone-600 uppercase mb-2 tracking-wider">
          {t.dashboard.latitude} (WGS84)
        </label>
        <input
          type="number"
          step="0.0000001"
          min={-90}
          max={90}
          value={lat ?? ""}
          onChange={(e) => {
            const la = parseCoord(e.target.value);
            if (la != null && lon != null) onChange(la, lon);
          }}
          placeholder="e.g. 28.4575790"
          className="w-full font-mono text-sm rounded-lg border border-stone-200/80 px-3 py-2.5 focus:border-[#2e7d32] focus:ring-2 focus:ring-[#2e7d32]/20 shadow-sm transition-all bg-white"
        />
      </div>
      <div>
        <label className="block text-[10px] font-extrabold text-stone-600 uppercase mb-2 tracking-wider">
          {t.dashboard.longitude} (WGS84)
        </label>
        <input
          type="number"
          step="0.0000001"
          min={-180}
          max={180}
          value={lon ?? ""}
          onChange={(e) => {
            const lo = parseCoord(e.target.value);
            if (lat != null && lo != null) onChange(lat, lo);
          }}
          placeholder="e.g. 77.5166510"
          className="w-full font-mono text-sm rounded-lg border border-stone-200/80 px-3 py-2.5 focus:border-[#2e7d32] focus:ring-2 focus:ring-[#2e7d32]/20 shadow-sm transition-all bg-white"
        />
      </div>
    </div>
  );
}
