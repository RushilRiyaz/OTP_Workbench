"use client";

import { useTranslations } from "next-intl";

const TAB_IDS = [
  "routing",
  "routing-comparison",
  "stopmonitor",
  "nearby-search",
  "autocomplete",
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
    <div className="flex justify-center px-2 pt-2">
      <div className="flex gap-0.5 bg-zinc-100/80 dark:bg-zinc-800/80 backdrop-blur-sm rounded-xl p-1">
        {TAB_IDS.map((tabId) => (
          <button
            key={tabId}
            onClick={() => onTabChange(tabId)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-lvb-yellow whitespace-nowrap ${
              activeTab === tabId
                ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm"
                : "text-zinc-500 dark:text-zinc-400 hover:bg-white/50 dark:hover:bg-zinc-700/50 hover:text-zinc-800 dark:hover:text-zinc-200"
            }`}
          >
            {t(TAB_KEYS[tabId])}
          </button>
        ))}
      </div>
    </div>
  );
}

// Export for backwards compatibility
export const tabs = TAB_IDS.map((id) => ({ id }));
