"use client";

import { useState } from "react";

interface ParameterAreaProps {
  children?: React.ReactNode;
}

export default function ParameterArea({ children }: ParameterAreaProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <aside
      className={`
        h-full bg-zinc-100 dark:bg-zinc-900 border-r border-zinc-300 dark:border-zinc-700
        transition-all duration-300 ease-in-out overflow-hidden flex flex-col
        ${isExpanded ? "w-64 min-w-64" : "w-12 min-w-12"}
      `}
    >
      {/* Header with toggle button */}
      <div className={`flex-shrink-0 flex items-center ${isExpanded ? "justify-between p-4 pb-0" : "justify-center p-2"}`}>
        {isExpanded && (
          <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
            Parameter area
          </h2>
        )}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          flex-1 overflow-y-auto transition-opacity duration-300
          ${isExpanded ? "opacity-100 p-4 pt-4" : "opacity-0 pointer-events-none"}
        `}
      >
        {children}
      </div>
    </aside>
  );
}
