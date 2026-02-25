"use client";

import { useTranslations } from "next-intl";

/** Shared empty state for comparison layouts */
export function ComparisonEmptyState({ selectedEnvironments }: { selectedEnvironments: string[] }) {
  const t = useTranslations("Comparison");
  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="mx-auto w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-3">
          <svg className="w-6 h-6 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 6h18M3 12h18M3 18h18" />
          </svg>
        </div>
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
          {selectedEnvironments.length === 0
            ? t("selectEnvironments")
            : t("submitToCompare")}
        </p>
        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
          {selectedEnvironments.length === 0
            ? t("chooseUpTo3")
            : t("environmentsSelected", { count: selectedEnvironments.length })}
        </p>
      </div>
    </div>
  );
}
