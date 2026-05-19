"use client";

import { ChevronDown, ChevronUp, ShieldAlert, Info } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import IcarLogo from "@/components/IcarLogo";
import type { AnalyzeResponse } from "@/lib/types";
import { useLanguage } from "@/contexts/LanguageContext";

interface AnalysisResultsProps {
  result: AnalyzeResponse;
}

function getMeasureImage(measureStr: string | undefined): string {
  if (!measureStr) return "/images/erosion_control_measure.png";
  
  const m = measureStr.toLowerCase();
  if (m.includes("contour bunding") || m.includes("contour farming")) return "/images/measures/contour_bunding.png";
  if (m.includes("terrac") || m.includes("bench")) return "/images/measures/bench_terracing.png";
  if (m.includes("check dam")) return "/images/measures/check_dams.png";
  
  return "/images/erosion_control_measure.png";
}

function generateExplanation(result: AnalyzeResponse, language: string): string {
  const slope = result.factors?.slope_percent ?? 0;
  const rainfall = result.factors?.rainfall_mm ?? 0;
  const measure = result.mechanical_measures?.measures?.[0] || "this measure";
  
  if (language === "hi") {
    let explanation = `इस क्षेत्र के पर्यावरणीय कारकों के आधार पर, ${measure} की अत्यधिक अनुशंसा की जाती है। `;
    
    if (slope > 10) {
      explanation += `${slope}% की खड़ी ढलान से अपवाह वेग और मिट्टी के कटाव का खतरा काफी बढ़ जाता है। ${measure} सतह के अपवाह को रोकेगा और ढलान की लंबाई को तोड़ देगा। `;
    } else if (slope > 2) {
      explanation += `${slope}% की मध्यम ढलान तीव्र वर्षा के दौरान मिट्टी के नुकसान में योगदान करती है। ${measure} को लागू करने से पानी के बहाव को धीमा करने और मिट्टी में घुसपैठ को बढ़ावा देने के लिए बाधाएं पैदा होती हैं। `;
    } else {
      explanation += `${slope}% की अपेक्षाकृत सपाट ढलान पर भी, चादर कटाव (sheet erosion) को रोकने के लिए उचित प्रबंधन की आवश्यकता होती है। `;
    }
    
    if (rainfall > 1000) {
      explanation += `इसके अतिरिक्त, ${rainfall} मिमी की उच्च वार्षिक वर्षा के लिए अतिरिक्त पानी को सुरक्षित रूप से निकालने के लिए मजबूत यांत्रिक संरचनाओं की आवश्यकता होती है।`;
    } else if (rainfall > 500) {
      explanation += ` ${rainfall} मिमी की मध्यम वर्षा का मतलब है कि नमी को पकड़ना और बनाए रखना महत्वपूर्ण है, जिसकी यह उपाय सुविधा प्रदान करता है।`;
    }
    
    return explanation;
  }

  let explanation = `Based on the environmental factors of this field, ${measure} is highly recommended. `;
  
  if (slope > 10) {
    explanation += `The steep slope of ${slope}% significantly increases runoff velocity and soil erosion risk. ${measure} will intercept the surface runoff and break the slope length. `;
  } else if (slope > 2) {
    explanation += `The moderate slope of ${slope}% contributes to soil loss during intense precipitation. Implementing ${measure} creates barriers to slow down water flow and promote soil infiltration. `;
  } else {
    explanation += `Even on a relatively flat slope of ${slope}%, proper management is required to prevent sheet erosion. `;
  }
  
  if (rainfall > 1000) {
    explanation += `Additionally, the high annual rainfall of ${rainfall} mm necessitates robust mechanical structures to safely dispose of excess water without degrading the land.`;
  } else if (rainfall > 500) {
    explanation += `The moderate rainfall of ${rainfall} mm means capturing and retaining moisture in situ is critical, which this measure facilitates.`;
  }
  
  return explanation;
}

export default function AnalysisResults({
  result,
}: AnalysisResultsProps) {
  const { t, language } = useLanguage();
  const [showDetailed, setShowDetailed] = useState(false);

  const measureImage = getMeasureImage(result.mechanical_measures?.measures?.[0]);
  const explanation = generateExplanation(result, language);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 mt-8">
      {result.status === "NON_ARABLE" ? (
        <div className="bg-white rounded-2xl border border-[#d97706]/30 shadow-[0_4px_20px_rgb(0,0,0,0.03)] overflow-hidden relative">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-[#d97706]" />
          <div className="p-6 sm:p-8 pl-10">
            <div className="flex items-center gap-2 mb-2">
              <ShieldAlert className="w-5 h-5 text-[#d97706]" />
              <span className="text-sm font-extrabold text-[#d97706] uppercase tracking-wider">
                {t.results.title}
              </span>
            </div>
            <h2 className="text-2xl font-extrabold text-stone-900 mt-2 mb-3">
              Non-Arable Land Detected
            </h2>
            <p className="text-stone-600 text-lg font-medium leading-relaxed">
              KrishiRakshak AI is calibrated for arable agricultural land. The
              selected context indicates{" "}
              <strong className="text-stone-900">{result.reason || "non-arable land"}</strong>.
            </p>
          </div>
        </div>
      ) : result.status === "OK" ? (
        <div className="bg-white rounded-2xl border border-[#005a32]/20 shadow-[0_4px_20px_rgb(0,0,0,0.03)] overflow-hidden relative">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-[#005a32]" />
          <div className="p-6 sm:p-8 pl-10">
            <div className="flex items-center gap-2 mb-2">
              <IcarLogo size="xs" />
              <span className="text-sm font-extrabold text-[#005a32] uppercase tracking-wider">
                {t.results.recommendedMeasures}
              </span>
            </div>
            
            <div className="flex flex-col md:flex-row gap-8 mb-8">
              <div className="flex-1">
                <h2 className="text-3xl font-extrabold text-[#003e21] mt-2 mb-6 tracking-tight leading-tight capitalize">
                  {result.mechanical_measures?.measures?.[0] ||
                    "No specific mechanical measure required."}
                </h2>
                
                <div className="flex flex-wrap gap-3 mb-6">
                  <span className="inline-flex items-center rounded-lg bg-emerald-50 px-4 py-1.5 text-sm font-bold text-emerald-800 ring-1 ring-inset ring-emerald-600/20 shadow-sm uppercase">
                    Risk: {result.erosion_risk?.level || "Unknown"}
                  </span>
                  <span className="inline-flex items-center rounded-lg bg-stone-50 px-4 py-1.5 text-sm font-bold text-stone-700 ring-1 ring-inset ring-stone-500/10 shadow-sm uppercase">
                    Score: {result.erosion_risk?.score ?? "—"}
                  </span>
                  {result.mechanical_measures?.mode && (
                    <span className="inline-flex items-center rounded-lg bg-blue-50 px-4 py-1.5 text-sm font-bold text-blue-800 ring-1 ring-inset ring-blue-600/20 shadow-sm uppercase">
                      Mode: {result.mechanical_measures.mode}
                    </span>
                  )}
                </div>
              </div>

              {(result.mechanical_measures?.measures?.[0]) && (
                <div className="relative w-full md:w-64 h-48 rounded-xl overflow-hidden shadow-md shrink-0 border border-stone-200/50">
                  <Image
                    src={measureImage}
                    alt={result.mechanical_measures.measures[0]}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-2 left-3 right-3">
                    <p className="text-white text-xs font-semibold leading-tight drop-shadow-md">
                      Illustration of sustainable ICAR soil conservation practices
                    </p>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setShowDetailed(!showDetailed)}
              className="flex items-center gap-2 text-sm font-bold text-[#005a32] hover:text-[#003e21] transition-colors py-2"
            >
              <Info className="w-4 h-4" />
              {showDetailed ? "Hide Detailed Analysis" : "View Detailed Analysis"}
              {showDetailed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showDetailed && (
              <div className="mt-6 pt-6 border-t border-stone-100 animate-in fade-in slide-in-from-top-2 duration-300">
                <p className="text-stone-700 font-medium leading-relaxed mb-6 bg-emerald-50/50 p-4 rounded-xl border border-emerald-100/50">
                  {explanation}
                </p>

                <h3 className="text-xs font-extrabold text-stone-900 uppercase tracking-wider mb-4">
                  {t.results.riskAssessment}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    {
                      label: "Latitude",
                      value:
                        result.input?.lat != null
                          ? result.input.lat.toFixed(7)
                          : "Unknown",
                    },
                    {
                      label: "Longitude",
                      value:
                        result.input?.lon != null
                          ? result.input.lon.toFixed(7)
                          : "Unknown",
                    },
                    {
                      label: "Crop / Land Use",
                      value: result.input?.land_use || result.factors?.land_use || "Unknown",
                    },
                    {
                      label: "Rainfall",
                      value: `${result.factors?.rainfall_mm ?? 0} mm`,
                    },
                    {
                      label: t.results.slope,
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
                    {
                      label: "Rule Mode",
                      value: result.mechanical_measures?.mode || "Unknown",
                    },
                    {
                      label: "Risk Score",
                      value: String(result.erosion_risk?.score ?? "Unknown"),
                    },
                  ].map((metric) => (
                    <div
                      key={metric.label}
                      className="bg-stone-50/80 p-4 rounded-xl border border-stone-200/60 shadow-sm"
                    >
                      <div className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                        {metric.label}
                      </div>
                      <div className="text-lg font-extrabold text-stone-900 mt-1 capitalize">
                        {metric.value}
                      </div>
                    </div>
                  ))}
                </div>

                {(result.mechanical_measures?.measures?.length ?? 0) > 1 && (
                  <div className="mt-8">
                    <h3 className="text-xs font-extrabold text-stone-900 uppercase tracking-wider mb-4">
                      Alternative Measures
                    </h3>
                    <ul className="list-none space-y-3">
                      {result.mechanical_measures!.measures!.slice(1).map((m) => (
                        <li key={m} className="flex items-start gap-3 text-stone-700 font-medium bg-stone-50/50 p-3 rounded-xl border border-stone-100">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#005a32] mt-2 shrink-0" />
                          {m}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-red-50/80 border border-red-200 text-red-700 p-6 rounded-2xl shadow-sm">
          <strong className="font-bold">Error:</strong>{" "}
          <span className="font-medium">{result.message || "An unexpected error occurred."}</span>
        </div>
      )}
    </div>
  );
}
