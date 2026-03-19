"use client";

import dynamic from "next/dynamic";

const StopMonitorMapView = dynamic(() => import("./StopMonitorMapView"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-zinc-500 dark:text-zinc-400 text-sm">
      Loading map...
    </div>
  ),
});

export default StopMonitorMapView;
