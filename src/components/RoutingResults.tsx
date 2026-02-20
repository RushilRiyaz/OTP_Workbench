"use client";

import type { RoutingResponse } from "@/lib/routing";
import ItineraryCard from "./ItineraryCard";

interface RoutingResultsProps {
  routingResult: RoutingResponse | null;
  selectedIndex: number;
  onSelectItinerary: (index: number) => void;
}

export default function RoutingResults({
  routingResult,
  selectedIndex,
  onSelectItinerary,
}: RoutingResultsProps) {
  const itineraries = routingResult?.plan?.itineraries ?? [];

  if (!routingResult || itineraries.length === 0) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <div className="text-center">
          <div className="mx-auto w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-2">
            <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">No routing results yet.</p>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">Submit a routing request to see itineraries.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto p-3 gap-2">
      <div className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-1">
        {itineraries.length} Itinerar{itineraries.length === 1 ? "y" : "ies"}
      </div>
      {itineraries.map((itinerary, i) => (
        <ItineraryCard
          key={i}
          itinerary={itinerary}
          index={i}
          isSelected={i === selectedIndex}
          onSelect={onSelectItinerary}
        />
      ))}
    </div>
  );
}
