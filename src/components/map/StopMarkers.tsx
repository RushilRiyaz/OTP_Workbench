"use client";

// Clickable "H" (Haltestelle) markers for the Stop Monitor map

import { Marker, Tooltip } from "react-leaflet";
import L from "leaflet";
import type { StopsItem } from "@/lib/stopMonitor";

function createStopIcon(isSelected: boolean): L.DivIcon {
  const bg = isSelected ? "#FBC10F" : "#D8B23E";
  const border = isSelected ? "#a37a00" : "#a07e1e";
  const textColor = isSelected ? "#1a1200" : "#1a1200";
  return L.divIcon({
    className: "",
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    tooltipAnchor: [0, -13],
    html: `<div style="
      width:22px;height:22px;
      background:${bg};
      border:2px solid ${border};
      border-radius:50%;
      display:flex;align-items:center;justify-content:center;
      font-size:11px;font-weight:900;color:${textColor};
      box-shadow:0 1px 4px rgba(0,0,0,0.35);
      cursor:pointer;
      line-height:1;
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
