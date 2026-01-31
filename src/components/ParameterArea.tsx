interface ParameterAreaProps {
  children?: React.ReactNode;
}

export default function ParameterArea({ children }: ParameterAreaProps) {
  return (
    <aside className="w-64 min-w-64 h-full bg-zinc-100 dark:bg-zinc-900 border-r border-zinc-300 dark:border-zinc-700 flex flex-col">
      <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 p-4 pb-0 mb-4">
        Parameter area
      </h2>
      <div className="flex-1 overflow-y-auto p-4 pt-0">
        {children}
      </div>
    </aside>
  );
}
