"use client";

// Clickable "H" (Haltestelle) markers for the Stop Monitor map
// Parent stops shown on map; children revealed in an Apple-style popup on click.

import { useRef, useState } from "react";
import { Marker, Popup, Tooltip } from "react-leaflet";
import L from "leaflet";
import type { StopsItem } from "@/lib/api/stopMonitor";
import { useIsDark } from "@/lib/hooks/useIsDark";

// --- Icon factory ---

function createParentIcon(isSelected: boolean, dimmed = false): L.DivIcon {
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
      opacity:${dimmed ? 0.2 : 1};
      transition:opacity 0.2s ease;
    ">H</div>`,
  });
}

// --- Grouping by name pattern ---

interface StopGroup {
  parent: StopsItem;
  children: StopsItem[];
}

/**
 * Strip platform/mode qualifiers to get a grouping key.
 * "Leipzig, Hauptbahnhof (Tram/Bus) Steig A" → "Leipzig, Hauptbahnhof"
 * "Leipzig, Augustusplatz (Tram)"            → "Leipzig, Augustusplatz"
 */
function canonicalName(name: string): string {
  return name
    .replace(/\s+Steig\s+\S+$/i, "")
    .replace(/\s*\([^)]+\)\s*$/, "")
    .trim();
}

function groupStops(stops: StopsItem[]): StopGroup[] {
  const buckets = new Map<string, StopsItem[]>();
  for (const stop of stops) {
    const key = canonicalName(stop.stop_name);
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key)!.push(stop);
  }

  return Array.from(buckets.values()).map((members) => {
    // Prefer the _parent stop as representative, else highest priority
    const representative =
      members.find((s) => s.stop_id.endsWith("_parent")) ??
      members.reduce((best, s) => (s.priority > best.priority ? s : best));
    const children = members.filter((s) => s.stop_id !== representative.stop_id);
    return { parent: representative, children };
  });
}

// --- Popup content ---

function StopChildrenPopup({
  parent,
  children,
  isDark,
  onSelect,
}: {
  parent: StopsItem;
  children: StopsItem[];
  isDark: boolean;
  onSelect: (stop: StopsItem) => void;
}) {
  const textPrimary = isDark ? "#f4f4f5" : "#18181b";
  const textSecondary = isDark ? "#a1a1aa" : "#52525b";
  const divider = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)";
  const hoverBg = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.04)";

  const btnStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 8,
    width: "100%",
    padding: "7px 10px",
    borderRadius: 10,
    border: "none",
    background: "none",
    cursor: "pointer",
    textAlign: "left",
    fontSize: 12.5,
    fontWeight: 500,
    color: textSecondary,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", sans-serif',
    transition: "background 0.12s",
  };

  const badge = (bg: string, border: string, color: string): React.CSSProperties => ({
    width: 20, height: 20,
    borderRadius: "50%",
    background: bg,
    border: `1.5px solid ${border}`,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 9, fontWeight: 900, color,
    flexShrink: 0,
  });

  return (
    <div style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", sans-serif',
      minWidth: 210, maxWidth: 280,
    }}>
      {/* Header */}
      <div style={{ padding: "12px 14px 10px", borderBottom: `1px solid ${divider}` }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: textPrimary, lineHeight: 1.3 }}>
          {canonicalName(parent.stop_name)}
        </div>
        <div style={{ fontSize: 11, color: textSecondary, marginTop: 2 }}>
          {children.length + 1} stop{children.length !== 0 ? "s" : ""}
        </div>
      </div>

      {/* Stop list */}
      <div style={{ padding: "6px" }}>
        {/* Parent row */}
        <button
          style={btnStyle}
          onMouseEnter={(e) => (e.currentTarget.style.background = hoverBg)}
          onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
          onClick={() => onSelect(parent)}
        >
          <span style={badge("#FBC10F", "#a07e1e", "#1a1200")}>H</span>
          <span>{parent.stop_name}</span>
        </button>

        {children.length > 0 && (
          <div style={{ height: 1, background: divider, margin: "4px 4px" }} />
        )}

        {/* Child rows */}
        {children.map((child) => (
          <button
            key={child.stop_id}
            style={btnStyle}
            onMouseEnter={(e) => (e.currentTarget.style.background = hoverBg)}
            onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
            onClick={() => onSelect(child)}
          >
            <span style={badge("#93c5fd", "#3b82f6", "#1e3a5f")}>H</span>
            <span>{child.stop_name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// --- Main component ---

interface StopMarkersProps {
  stops: StopsItem[];
  selectedStopId?: string | null;
  onStopClick: (stop: StopsItem) => void;
}

export default function StopMarkers({ stops, selectedStopId, onStopClick }: StopMarkersProps) {
  const isDark = useIsDark();
  const [hoveredParentId, setHoveredParentId] = useState<string | null>(null);
  const openPopupRef = useRef<string | null>(null);

  const groups = groupStops(stops);

  return (
    <>
      {groups.map(({ parent, children }) => {
        const isSelected =
          parent.stop_id === selectedStopId ||
          `${parent.stop_id}_parent` === selectedStopId ||
          parent.stop_id === selectedStopId?.replace("_parent", "");

        const isDimmed = hoveredParentId !== null && hoveredParentId !== parent.stop_id;

        return (
          <Marker
            key={parent.stop_id}
            position={[parent.lat, parent.lon]}
            icon={createParentIcon(isSelected, isDimmed)}
            zIndexOffset={isSelected ? 1000 : 0}
            eventHandlers={{
              click: () => { if (children.length === 0) onStopClick(parent); },
              mouseover: () => setHoveredParentId(parent.stop_id),
              mouseout: () => {
                if (openPopupRef.current !== parent.stop_id) setHoveredParentId(null);
              },
              popupopen: () => {
                openPopupRef.current = parent.stop_id;
                setHoveredParentId(parent.stop_id);
              },
              popupclose: () => {
                openPopupRef.current = null;
                setHoveredParentId(null);
              },
            }}
          >
            <Tooltip direction="top" offset={[0, -13]} opacity={0.95}>
              {canonicalName(parent.stop_name)}
              {children.length > 0 && (
                <span style={{ color: "#a1a1aa", marginLeft: 4 }}>
                  ({children.length + 1} stops)
                </span>
              )}
            </Tooltip>

            {children.length > 0 && (
              <Popup
                className="stop-children-popup"
                closeButton={false}
                offset={[0, -14]}
                maxWidth={300}
              >
                <StopChildrenPopup
                  parent={parent}
                  children={children}
                  isDark={isDark}
                  onSelect={onStopClick}
                />
              </Popup>
            )}
          </Marker>
        );
      })}
    </>
  );
}
