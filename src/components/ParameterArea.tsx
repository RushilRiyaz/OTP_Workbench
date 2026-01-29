interface ParameterAreaProps {
  children?: React.ReactNode;
}

export default function ParameterArea({ children }: ParameterAreaProps) {
  return (
    <aside className="w-64 min-w-64 h-full bg-zinc-100 dark:bg-zinc-900 border-r border-zinc-300 dark:border-zinc-700 p-4">
      <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 mb-4">
        Parameter area
      </h2>
      {children}
    </aside>
  );
}
