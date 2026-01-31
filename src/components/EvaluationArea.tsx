"use client";

import Tabs, { TabId } from "./Tabs";

interface EvaluationAreaProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  children?: React.ReactNode;
}

export default function EvaluationArea({
  activeTab,
  onTabChange,
  children,
}: EvaluationAreaProps) {
  return (
    <main className="flex-1 flex flex-col h-full bg-zinc-50 dark:bg-zinc-950">
      <Tabs activeTab={activeTab} onTabChange={onTabChange} />
      <div className="flex-1 p-4">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Evaluation area - {activeTab}
        </p>
        {children}
      </div>
    </main>
  );
}
