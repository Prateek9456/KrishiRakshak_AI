"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  LayersControl,
  CircleMarker,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import type { Marker as LeafletMarker } from "leaflet";

const INDIA_CENTER: [number, number] = [20.5937, 78.9629];
const FIELD_ZOOM = 17;
const MAX_ZOOM = 20;

/** Center-anchored pin — coordinate = exact circle center (no icon offset). */
const preciseIcon = L.divIcon({
  className: "swc-pin-wrapper",
  html: '<div class="swc-pin-dot" aria-hidden="true"></div>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

interface FieldMapProps {
  lat: number | null;
  lon: number | null;
  onLocationChange: (lat: number, lon: number) => void;
  flyTo?: { lat: number; lon: number; zoom?: number } | null;
}

function MapFlyTo({
  flyTo,
}: {
  flyTo?: { lat: number; lon: number; zoom?: number } | null;
}) {
  const map = useMap();
  useEffect(() => {
    if (flyTo) {
      map.flyTo([flyTo.lat, flyTo.lon], flyTo.zoom ?? FIELD_ZOOM, {
        duration: 0.8,
      });
    }
  }, [flyTo, map]);
  return null;
}

function MapResizer() {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 200);
    return () => clearTimeout(t);
  }, [map]);
  return null;
}

function MapScale() {
  const map = useMap();
  useEffect(() => {
    const scale = L.control.scale({ imperial: false, metric: true });
    scale.addTo(map);
    return () => {
      scale.remove();
    };
  }, [map]);
  return null;
}

function PrecisionMarker({
  lat,
  lon,
  onLocationChange,
}: {
  lat: number | null;
  lon: number | null;
  onLocationChange: (lat: number, lon: number) => void;
}) {
  const markerRef = useRef<LeafletMarker | null>(null);
  const map = useMap();

  const setPosition = useCallback(
    (newLat: number, newLon: number) => {
      const roundedLat = Math.round(newLat * 1e7) / 1e7;
      const roundedLon = Math.round(newLon * 1e7) / 1e7;
      onLocationChange(roundedLat, roundedLon);
    },
    [onLocationChange]
  );

  useMapEvents({
    click(e) {
      setPosition(e.latlng.lat, e.latlng.lng);
      map.setView(e.latlng, Math.max(map.getZoom(), FIELD_ZOOM));
    },
  });

  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const m = markerRef.current;
        if (m) {
          const { lat: la, lng: lo } = m.getLatLng();
          setPosition(la, lo);
        }
      },
    }),
    [setPosition]
  );

  if (lat == null || lon == null) return null;

  return (
    <>
      <CircleMarker
        center={[lat, lon]}
        radius={4}
        pathOptions={{
          color: "#ffffff",
          weight: 2,
          fillColor: "#005a32",
          fillOpacity: 1,
        }}
      />
      <Marker
        draggable
        ref={markerRef}
        position={[lat, lon]}
        icon={preciseIcon}
        eventHandlers={eventHandlers}
      />
    </>
  );
}

export default function FieldMap({
  lat,
  lon,
  onLocationChange,
  flyTo,
}: FieldMapProps) {
  const initialCenter: [number, number] =
    lat != null && lon != null ? [lat, lon] : INDIA_CENTER;
  const initialZoom = lat != null && lon != null ? FIELD_ZOOM : 5;

  return (
    <div className="h-[480px] w-full border border-stone-200 rounded-lg overflow-hidden shadow-inner z-0">
      <MapContainer
        center={initialCenter}
        zoom={initialZoom}
        minZoom={4}
        maxZoom={MAX_ZOOM}
        scrollWheelZoom
        className="h-full w-full cursor-crosshair"
      >
        <MapResizer />
        <MapScale />
        <LayersControl position="topright">
          <LayersControl.BaseLayer name="Street (reference)">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxNativeZoom={19}
              maxZoom={MAX_ZOOM}
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Satellite (Esri)">
            <TileLayer
              attribution="Tiles &copy; Esri"
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              maxNativeZoom={19}
              maxZoom={MAX_ZOOM}
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer checked name="Satellite labels">
            <TileLayer
              attribution="Esri"
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              maxNativeZoom={19}
              maxZoom={MAX_ZOOM}
            />
            <TileLayer
              attribution="Esri"
              url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
              maxNativeZoom={19}
              maxZoom={MAX_ZOOM}
            />
          </LayersControl.BaseLayer>
        </LayersControl>
        <MapFlyTo flyTo={flyTo} />
        <PrecisionMarker
          lat={lat}
          lon={lon}
          onLocationChange={onLocationChange}
        />
      </MapContainer>
    </div>
  );
}
