"use client";

import { useState, useRef, useCallback, useEffect } from "react";

// Width values as percentage of viewport width
const DEFAULT_WIDTH_PERCENT = 28; // Start between 1/4 (25%) and 1/3 (33%)
const MIN_WIDTH_PERCENT = 12;
const MAX_WIDTH_PERCENT = 50;
const COLLAPSED_WIDTH = 48; // Keep collapsed width in pixels

interface ParameterAreaProps {
  children?: React.ReactNode;
}

export default function ParameterArea({ children }: ParameterAreaProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [widthPercent, setWidthPercent] = useState(DEFAULT_WIDTH_PERCENT);
  const [isDragging, setIsDragging] = useState(false);
  const isResizing = useRef(false);
  const sidebarRef = useRef<HTMLElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    setIsDragging(true);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return;
      // Convert clientX to percentage of viewport width
      const newWidthPercent = (e.clientX / window.innerWidth) * 100;
      const clampedPercent = Math.min(MAX_WIDTH_PERCENT, Math.max(MIN_WIDTH_PERCENT, newWidthPercent));
      setWidthPercent(clampedPercent);
    };

    const handleMouseUp = () => {
      if (!isResizing.current) return;
      isResizing.current = false;
      setIsDragging(false);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  return (
    <aside
      ref={sidebarRef}
      className="h-full bg-zinc-100 dark:bg-zinc-900 border-r border-zinc-300 dark:border-zinc-700 overflow-hidden flex flex-col relative flex-shrink-0"
      style={{
        width: isExpanded ? `${widthPercent}vw` : COLLAPSED_WIDTH,
        transition: isDragging ? "none" : "width 250ms cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      {/* Header with toggle button */}
      <div className={`flex-shrink-0 flex items-center transition-all duration-250 ${isExpanded ? "justify-between p-4 pb-3 border-b border-zinc-200 dark:border-zinc-800" : "justify-center p-2"}`}>
        <h2
          className={`text-xs font-semibold uppercase tracking-widest text-zinc-400 whitespace-nowrap transition-all duration-250 overflow-hidden ${
            isExpanded ? "max-w-40 opacity-100" : "max-w-0 opacity-0"
          }`}
        >
          Parameters
        </h2>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-lvb-yellow"
          title={isExpanded ? "Collapse" : "Expand"}
        >
          <svg
            className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? "" : "rotate-180"}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
      </div>

      {/* Content - only visible when expanded, scrollable */}
      <div
        className={`
          flex-1 overflow-y-auto transition-opacity duration-250
          ${isExpanded ? "opacity-100 p-4 pt-4 delay-100" : "opacity-0 pointer-events-none"}
        `}
      >
        {children}
      </div>

      {/* Resize handle */}
      {isExpanded && (
        <div
          onMouseDown={handleMouseDown}
          className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-lvb-yellow/40 active:bg-lvb-yellow/60 transition-colors"
        />
      )}
    </aside>
  );
}
