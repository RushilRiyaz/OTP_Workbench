"use client";

import dynamic from "next/dynamic";

// SSR wrapper for NearbySearchMapView - Leaflet requires browser APIs
const NearbySearchMapView = dynamic(() => import("./NearbySearchMapView"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-zinc-500 dark:text-zinc-400">
      Loading map...
    </div>
  ),
});

export default NearbySearchMapView;
