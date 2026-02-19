"use client";

import { useState, useEffect } from "react";

interface DateTimeInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  error?: string;
}

export default function DateTimeInput({
  label,
  value,
  onChange,
  required = false,
  error,
}: DateTimeInputProps) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const check = () => {
      const hasDark = document.documentElement.classList.contains("dark");
      const hasLight = document.documentElement.classList.contains("light");
      setIsDark(hasDark || (mediaQuery.matches && !hasLight));
    };
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    mediaQuery.addEventListener("change", check);
    return () => {
      observer.disconnect();
      mediaQuery.removeEventListener("change", check);
    };
  }, []);

  // Hide the native calendar indicator but keep it on top so it still handles clicks
  useEffect(() => {
    const styleId = "datetime-picker-custom-icon";
    let el = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!el) {
      el = document.createElement("style");
      el.id = styleId;
      document.head.appendChild(el);
    }
    el.textContent = `
      input[type="datetime-local"]::-webkit-calendar-picker-indicator {
        opacity: 0;
        width: 20px;
        height: 20px;
        cursor: pointer;
        position: relative;
        z-index: 1;
      }
    `;
  }, []);

  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="relative">
        <input
          type="datetime-local"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{ colorScheme: isDark ? "dark" : "light" }}
          className={`w-full px-3 py-2.5 text-sm rounded-lg border shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:border-transparent hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors ${
            error
              ? "border-red-500 focus:ring-red-500"
              : "border-zinc-200 dark:border-zinc-700 focus:ring-lvb-yellow focus:border-lvb-yellow/50"
          }`}
        />
        {/* Custom calendar icon — pointer-events-none so the invisible native indicator above handles clicks */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`w-4 h-4 ${isDark ? "text-white" : "text-zinc-500"}`}
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </div>
      </div>
      {error && (
        <p className="text-xs text-red-500 mt-1">{error}</p>
      )}
    </div>
  );
}
