"use client";

import { useTranslations } from "next-intl";
import ThemeToggle from "./ThemeToggle";
import LanguageSwitcher from "./LanguageSwitcher";

export default function Header() {
  const t = useTranslations("Header");

  return (
    <header className="h-14 bg-lvb-yellow flex items-center justify-between px-4 shadow-md border-b border-lvb-yellow-dark/30">
      {/* LVB Logo and Title */}
      <div className="flex items-center gap-3">
        <img src="/lvb-logo.png" alt="LVB Logo" className="h-10 w-10 rounded-lg object-contain ring-1 ring-lvb-yellow-dark/20" />
        <div className="flex flex-col">
          <span className="text-lvb-dark font-bold text-lg leading-tight tracking-tight">
            {t("title")}
          </span>
          <span className="text-lvb-dark/70 text-xs leading-tight">
            {t("subtitle")}
          </span>
        </div>
      </div>

      {/* Language Switch + Theme Toggle */}
      <div className="flex items-center gap-2">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>
    </header>
  );
}
