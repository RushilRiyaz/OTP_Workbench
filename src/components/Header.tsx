"use client";

import ThemeToggle from "./ThemeToggle";

export default function Header() {
  return (
    <header className="h-14 bg-lvb-yellow flex items-center justify-between px-4 shadow-sm">
      {/* LVB Logo and Title */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 bg-lvb-dark rounded-lg">
          <span className="text-lvb-yellow font-bold text-lg">L</span>
        </div>
        <div className="flex flex-col">
          <span className="text-lvb-dark font-bold text-lg leading-tight">
            OTP Workbench
          </span>
          <span className="text-lvb-gray text-xs leading-tight">
            Leipziger Verkehrsbetriebe
          </span>
        </div>
      </div>

      {/* Theme Toggle */}
      <ThemeToggle />
    </header>
  );
}
