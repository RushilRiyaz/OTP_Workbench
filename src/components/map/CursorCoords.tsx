"use client";

interface CursorCoordsProps {
  coords: { lat: number; lng: number } | null;
}

// FR8.6: Display coordinates under cursor
export default function CursorCoords({ coords }: CursorCoordsProps) {
  if (!coords) return null;

  return (
    <div className="absolute bottom-2 left-2 z-[1000] bg-white dark:bg-zinc-800 px-2 py-1 text-xs rounded shadow">
      {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
    </div>
  );
}
