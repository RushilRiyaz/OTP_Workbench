"use client";

const tabs = [
  { id: "routing", label: "Routing" },
  { id: "routing-comparison", label: "Routing Comparison" },
  { id: "autocomplete", label: "Autocomplete" },
  { id: "stopmonitor", label: "Stopmonitor" },
  { id: "nearby-search", label: "NearBySearch" },
] as const;

export type TabId = (typeof tabs)[number]["id"];

interface TabsProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export default function Tabs({ activeTab, onTabChange }: TabsProps) {
  return (
    <div className="flex gap-1 px-3 pt-2 bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors focus:outline-none focus:ring-2 focus:ring-lvb-yellow ${
            activeTab === tab.id
              ? "bg-white dark:bg-zinc-950 text-zinc-900 dark:text-lvb-yellow border border-zinc-200 dark:border-zinc-800 border-b-transparent -mb-px shadow-[0_-1px_3px_0_rgb(0,0,0,0.05)]"
              : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export { tabs };
