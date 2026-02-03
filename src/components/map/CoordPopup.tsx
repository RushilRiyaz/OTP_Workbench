"use client";

import { Popup } from "react-leaflet";

interface CoordPopupProps {
  coords: { lat: number; lng: number };
  onClose: () => void;
}

// FR8.4-8.5: Popup with copy functionality when both start/dest are filled
export default function CoordPopup({ coords, onClose }: CoordPopupProps) {
  const coordString = `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(coordString);
      onClose();
    } catch (error) {
      console.error("Failed to copy coordinates:", error);
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
          className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Copy
        </button>
      </div>
    </Popup>
  );
}
