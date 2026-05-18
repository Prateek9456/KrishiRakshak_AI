"use client";

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
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 p-3 rounded-lg border border-[#005a32]/20 bg-[#f0f7f2]">
      <p className="sm:col-span-2 text-xs text-[#1b5e20] font-medium">
        Fine-tune coordinates (7 decimal places ≈ 1 cm). Drag the pin or type
        exact values — required for accurate ICAR field analysis.
      </p>
      <div>
        <label className="block text-xs font-semibold text-stone-600 uppercase mb-1">
          Latitude (WGS84)
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
          className="w-full font-mono text-sm rounded-md border border-stone-300 px-2 py-1.5 focus:border-[#005a32] focus:ring-1 focus:ring-[#005a32]"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-stone-600 uppercase mb-1">
          Longitude (WGS84)
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
          className="w-full font-mono text-sm rounded-md border border-stone-300 px-2 py-1.5 focus:border-[#005a32] focus:ring-1 focus:ring-[#005a32]"
        />
      </div>
    </div>
  );
}
