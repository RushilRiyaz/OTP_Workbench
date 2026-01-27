"use client";

import { useState } from "react";
import Tabs, { TabId } from "./Tabs";

interface EvaluationAreaProps {
  children?: React.ReactNode;
}

export default function EvaluationArea({ children }: EvaluationAreaProps) {
  const [activeTab, setActiveTab] = useState<TabId>("routing");

  return (
    <main className="flex-1 flex flex-col h-full bg-zinc-50 dark:bg-zinc-950">
      <Tabs activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="flex-1 p-4">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Evaluation area - {activeTab}
        </p>
        {children}
      </div>
    </main>
  );
}
