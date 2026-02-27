"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Popup } from "react-leaflet";
import { COORD_PRECISION } from "./constants";

interface CoordPopupProps {
  coords: { lat: number; lng: number };
  label?: string;
  onClose: () => void;
}

// FR8.4-8.5: Popup with copy functionality
export default function CoordPopup({ coords, label, onClose }: CoordPopupProps) {
  const t = useTranslations("Map");
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const coordString = `${coords.lat.toFixed(COORD_PRECISION)}, ${coords.lng.toFixed(COORD_PRECISION)}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(coordString);
      setCopyStatus("copied");
      setTimeout(onClose, 600);
    } catch (error) {
      console.error("Failed to copy coordinates:", error);
      setCopyStatus("failed");
      setTimeout(() => setCopyStatus("idle"), 1500);
    }
  };

  return (
    <Popup
      position={[coords.lat, coords.lng]}
      eventHandlers={{ remove: onClose }}
    >
      <div className="flex flex-col gap-1.5 min-w-[160px] -m-[1px]">
        {label && (
          <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
            {label}
          </span>
        )}
        <div className="flex items-center gap-1.5 bg-zinc-100 rounded-md px-2 py-1.5">
          {/* Pin icon */}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3 text-zinc-400 shrink-0">
            <path fillRule="evenodd" d="m7.539 14.841.003.003.002.002a.755.755 0 0 0 .912 0l.002-.002.003-.003.012-.009a5.57 5.57 0 0 0 .19-.153 15.588 15.588 0 0 0 2.046-2.082c1.101-1.362 2.291-3.342 2.291-5.597A5 5 0 0 0 3 7c0 2.255 1.19 4.235 2.291 5.597a15.591 15.591 0 0 0 2.236 2.236l.012.008ZM8 8.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" clipRule="evenodd" />
          </svg>
          <span className="text-xs font-mono text-zinc-700 select-all">{coordString}</span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          disabled={copyStatus !== "idle"}
          className={`flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-lvb-yellow ${
            copyStatus === "failed"
              ? "bg-red-100 text-red-600"
              : copyStatus === "copied"
                ? "bg-emerald-100 text-emerald-700"
                : "bg-lvb-yellow text-lvb-dark hover:bg-lvb-yellow-hover"
          }`}
        >
          {copyStatus === "copied" ? (
            <>
              {/* Check icon */}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
              </svg>
              {t("copied")}
            </>
          ) : copyStatus === "failed" ? (
            t("copyFailed")
          ) : (
            <>
              {/* Copy icon */}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                <path d="M5.5 3.5A1.5 1.5 0 0 1 7 2h2.879a1.5 1.5 0 0 1 1.06.44l2.122 2.12a1.5 1.5 0 0 1 .439 1.061V9.5A1.5 1.5 0 0 1 12 11V3.5H7a1.5 1.5 0 0 1-1.5-1.5V3.5Z" />
                <path d="M3.5 6A1.5 1.5 0 0 1 5 4.5h4.879a1.5 1.5 0 0 1 1.06.44l2.122 2.12a1.5 1.5 0 0 1 .439 1.061V12.5A1.5 1.5 0 0 1 12 14H5a1.5 1.5 0 0 1-1.5-1.5V6Z" />
              </svg>
              {t("copyCoordinates")}
            </>
          )}
        </button>
      </div>
    </Popup>
  );
}
