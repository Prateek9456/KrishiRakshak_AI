"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { Globe } from "lucide-react";

export default function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-1 bg-white/80 backdrop-blur-md border border-stone-200/50 p-1 rounded-full shadow-sm">
      <Globe className="w-4 h-4 text-stone-500 ml-2" />
      <div className="flex ml-1">
        <button
          onClick={() => setLanguage("en")}
          className={`px-3 py-1 text-xs font-semibold rounded-full transition-all duration-200 ${
            language === "en"
              ? "bg-[#005a32] text-white shadow-md"
              : "text-stone-500 hover:text-stone-800 hover:bg-stone-100"
          }`}
        >
          EN
        </button>
        <button
          onClick={() => setLanguage("hi")}
          className={`px-3 py-1 text-xs font-semibold rounded-full transition-all duration-200 ${
            language === "hi"
              ? "bg-[#005a32] text-white shadow-md"
              : "text-stone-500 hover:text-stone-800 hover:bg-stone-100"
          }`}
        >
          HI
        </button>
      </div>
    </div>
  );
}
