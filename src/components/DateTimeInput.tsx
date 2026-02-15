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
      <label className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type="datetime-local"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-3 py-2 text-sm rounded-md border bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${
          error
            ? "border-red-500 focus:ring-red-500"
            : "border-zinc-300 dark:border-zinc-700 focus:ring-lvb-yellow"
        }`}
      />
      {/* FR6: Validation error message */}
      {error && (
        <p className="text-xs text-red-500 mt-1">{error}</p>
      )}
    </div>
  );
}
