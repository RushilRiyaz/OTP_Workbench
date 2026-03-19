"use client";

import { useTranslations } from "next-intl";
import ThemeToggle from "../shared/ThemeToggle";
import LanguageSwitcher from "../shared/LanguageSwitcher";

export default function Header() {
  const t = useTranslations("Header");

  return (
    <header className="h-14 bg-lvb-yellow flex items-center justify-between px-4 shadow-md border-b border-lvb-yellow-dark/30">
      {/* LVB Logo and Title */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-lvb-dark dark:bg-white">
          <span className="text-lvb-yellow dark:text-lvb-dark text-xs font-black tracking-tight">LVB</span>
        </div>
        <div className="flex flex-col">
          <span className="text-lvb-dark font-bold text-lg leading-tight tracking-tight" style={{ fontFamily: "var(--font-inter)" }}>
            {t("title")}
          </span>
          <span className="text-lvb-dark/70 text-xs leading-tight" style={{ fontFamily: "var(--font-inter)" }}>
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
