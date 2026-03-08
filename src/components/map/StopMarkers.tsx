"use client";

// Clickable "H" (Haltestelle) markers for the Stop Monitor map

import { Marker, Tooltip } from "react-leaflet";
import L from "leaflet";
import type { StopsItem } from "@/lib/stopMonitor";

function createStopIcon(isSelected: boolean): L.DivIcon {
  const size = isSelected ? 32 : 22;
  const half = size / 2;
  const bg = isSelected ? "#FBC10F" : "#D8B23E";
  const border = isSelected ? "#a37a00" : "#a07e1e";
  const borderWidth = isSelected ? 3 : 2;
  const fontSize = isSelected ? 15 : 11;
  const shadow = isSelected
    ? "0 2px 10px rgba(251,193,15,0.55),0 1px 4px rgba(0,0,0,0.35)"
    : "0 1px 4px rgba(0,0,0,0.35)";
  return L.divIcon({
    className: "",
    iconSize: [size, size],
    iconAnchor: [half, half],
    tooltipAnchor: [0, -half - 2],
    html: `<div style="
      width:${size}px;height:${size}px;
      background:${bg};
      border:${borderWidth}px solid ${border};
      border-radius:50%;
      display:flex;align-items:center;justify-content:center;
      font-size:${fontSize}px;font-weight:900;color:#1a1200;
      box-shadow:${shadow};
      cursor:pointer;
      line-height:1;
      transition:all 0.15s ease;
    ">H</div>`,
  });
}

interface StopMarkersProps {
  stops: StopsItem[];
  /** Raw stop_id (with or without _parent) of the currently selected stop */
  selectedStopId?: string | null;
  onStopClick: (stop: StopsItem) => void;
}

export default function StopMarkers({ stops, selectedStopId, onStopClick }: StopMarkersProps) {
  return (
    <>
      {stops.map((stop) => {
        const isSelected =
          stop.stop_id === selectedStopId ||
          `${stop.stop_id}_parent` === selectedStopId ||
          stop.stop_id === selectedStopId?.replace("_parent", "");

        return (
          <Marker
            key={stop.stop_id}
            position={[stop.lat, stop.lon]}
            icon={createStopIcon(isSelected)}
            eventHandlers={{ click: () => onStopClick(stop) }}
            zIndexOffset={isSelected ? 1000 : 0}
          >
            <Tooltip direction="top" offset={[0, -13]} opacity={0.95}>
              {stop.stop_name}
            </Tooltip>
          </Marker>
        );
      })}
    </>
  );
}
