"use client";

import ThemeToggle from "./ThemeToggle";

export default function Header() {
  return (
    <header className="h-14 bg-lvb-yellow flex items-center justify-between px-4 shadow-sm">
      {/* LVB Logo and Title */}
      <div className="flex items-center gap-3">
        <img src="/lvb-logo.png" alt="LVB Logo" className="h-10 w-10 rounded-lg object-contain" />
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
