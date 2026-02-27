"use client";

import { useTranslations } from "next-intl";

const TAB_IDS = [
  "routing",
  "routing-comparison",
  "autocomplete",
  "stopmonitor",
  "nearby-search",
] as const;

export type TabId = (typeof TAB_IDS)[number];

// Map tab IDs to translation keys (hyphens → camelCase)
const TAB_KEYS: Record<TabId, string> = {
  "routing": "routing",
  "routing-comparison": "routingComparison",
  "autocomplete": "autocomplete",
  "stopmonitor": "stopmonitor",
  "nearby-search": "nearbySearch",
};

interface TabsProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export default function Tabs({ activeTab, onTabChange }: TabsProps) {
  const t = useTranslations("Tabs");

  return (
    <div className="flex gap-1 px-3 pt-2 bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
      {TAB_IDS.map((tabId) => (
        <button
          key={tabId}
          onClick={() => onTabChange(tabId)}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors focus:outline-none focus:ring-2 focus:ring-lvb-yellow ${
            activeTab === tabId
              ? "bg-white dark:bg-zinc-950 text-zinc-900 dark:text-lvb-yellow border border-zinc-200 dark:border-zinc-800 border-b-transparent -mb-px shadow-[0_-1px_3px_0_rgb(0,0,0,0.05)]"
              : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60"
          }`}
        >
          {t(TAB_KEYS[tabId])}
        </button>
      ))}
    </div>
  );
}

// Export for backwards compatibility
export const tabs = TAB_IDS.map((id) => ({ id }));
