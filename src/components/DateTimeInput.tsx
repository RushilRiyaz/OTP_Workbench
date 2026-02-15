"use client";

interface DateTimeInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  error?: string; // FR6: Validation error message
}

export default function DateTimeInput({
  label,
  value,
  onChange,
  required = false,
  error,
}: DateTimeInputProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type="datetime-local"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-3 py-2.5 text-sm rounded-lg border shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:border-transparent hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors ${
          error
            ? "border-red-500 focus:ring-red-500"
            : "border-zinc-200 dark:border-zinc-700 focus:ring-lvb-yellow focus:border-lvb-yellow/50"
        }`}
      />
      {/* FR6: Validation error message */}
      {error && (
        <p className="text-xs text-red-500 mt-1">{error}</p>
      )}
    </div>
  );
}
