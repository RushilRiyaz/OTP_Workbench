"use client";

import { useState } from "react";

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
    <div className="flex border-b border-zinc-300 dark:border-zinc-700">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === tab.id
              ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400"
              : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export { tabs };
