"use client";

import { useState } from "react";
import { useMapEvents } from "react-leaflet";

// FR8.6: Self-contained cursor coordinate tracker and display
export default function CursorTracker() {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  useMapEvents({
    mousemove(e) {
      setCoords({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
    mouseout() {
      setCoords(null);
    },
  });

  if (!coords) return null;

  return (
    <div className="absolute bottom-2 left-2 z-[1000] bg-white dark:bg-zinc-800 px-2 py-1 text-xs rounded shadow pointer-events-none">
      {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
    </div>
  );
}
