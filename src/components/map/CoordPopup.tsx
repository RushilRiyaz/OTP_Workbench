"use client";

import { useState } from "react";
import { Popup } from "react-leaflet";
import { COORD_PRECISION } from "./constants";

interface CoordPopupProps {
  coords: { lat: number; lng: number };
  onClose: () => void;
}

// FR8.4-8.5: Popup with copy functionality when both start/dest are filled
export default function CoordPopup({ coords, onClose }: CoordPopupProps) {
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const coordString = `${coords.lat.toFixed(COORD_PRECISION)}, ${coords.lng.toFixed(COORD_PRECISION)}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(coordString);
      setCopyStatus("copied");
      setTimeout(onClose, 500);
    } catch (error) {
      console.error("Failed to copy coordinates:", error);
      setCopyStatus("failed");
    }
  };

  return (
    <Popup
      position={[coords.lat, coords.lng]}
      eventHandlers={{ remove: onClose }}
    >
      <div className="flex flex-col gap-2 min-w-[140px]">
        <span className="text-sm font-mono">{coordString}</span>
        <button
          type="button"
          onClick={handleCopy}
          disabled={copyStatus !== "idle"}
          className={`px-2 py-1 text-xs rounded focus:outline-none focus:ring-2 focus:ring-lvb-yellow ${
            copyStatus === "failed"
              ? "bg-red-500 text-white"
              : copyStatus === "copied"
                ? "bg-green-500 text-white"
                : "bg-lvb-yellow text-lvb-dark hover:bg-lvb-yellow-hover"
          }`}
        >
          {copyStatus === "failed" ? "Failed" : copyStatus === "copied" ? "Copied!" : "Copy"}
        </button>
      </div>
    </Popup>
  );
}
