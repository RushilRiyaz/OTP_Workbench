"use client";

// FR14.2: Vertical time axis with hour markers
export function TimeAxis({
  hourMarkers,
  totalHeight,
}: {
  hourMarkers: { time: number; label: string; y: number }[];
  totalHeight: number;
}) {
  return (
    <div
      className="w-14 flex-shrink-0 relative border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50"
      style={{ height: totalHeight }}
    >
      {hourMarkers.map((marker, i) => (
        <div
          key={i}
          className="absolute left-0 right-0 flex items-center"
          style={{ top: marker.y }}
        >
          <span className="text-[10px] font-mono tabular-nums text-zinc-400 dark:text-zinc-500 px-1.5 -translate-y-1/2">
            {marker.label}
          </span>
        </div>
      ))}
    </div>
  );
}
