"use client";

import { useState, useRef } from "react";
import { useMapEvents } from "react-leaflet";
import { COORD_PRECISION } from "./constants";

// FR8.6: Self-contained cursor coordinate tracker and display
export default function CursorTracker() {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const lastUpdate = useRef(0);

  useMapEvents({
    mousemove(e) {
      const now = Date.now();
      if (now - lastUpdate.current < 100) return;
      lastUpdate.current = now;
      setCoords({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
    mouseout() {
      setCoords(null);
    },
  });

  if (!coords) return null;

  return (
    <div className="absolute bottom-2 left-2 z-[1000] bg-white dark:bg-zinc-800 px-2 py-1 text-xs rounded shadow pointer-events-none">
      {coords.lat.toFixed(COORD_PRECISION)}, {coords.lng.toFixed(COORD_PRECISION)}
    </div>
  );
}
