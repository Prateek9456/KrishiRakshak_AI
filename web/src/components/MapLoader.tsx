"use client";

import dynamic from "next/dynamic";

const FieldMap = dynamic(() => import("./FieldMap"), { ssr: false });

export interface MapLoaderProps {
  lat: number | null;
  lon: number | null;
  onLocationChange: (lat: number, lon: number) => void;
  flyTo?: { lat: number; lon: number; zoom?: number } | null;
}

export default function MapLoader(props: MapLoaderProps) {
  return <FieldMap {...props} />;
}
