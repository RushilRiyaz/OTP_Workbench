import { ITINERARY_COLORS } from "@/lib/types";

interface ComparisonCardShellProps {
  isSelected: boolean;
  isHovered: boolean;
  /** -1 = not selected, 0/1/2 = slot index in detail comparison */
  selectedSlotIndex: number;
  envColor: string;
  /** Extra classes for the outer div (e.g. "absolute left-1 right-1", "overflow-hidden") */
  className?: string;
  /** Inline style for the outer div (top, height, left, width, etc.) */
  style?: React.CSSProperties;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onClick?: () => void;
  /** Accent bar width class. Default "w-0.5". ComparisonOverview uses "w-1". */
  accentBarWidth?: string;
  children: React.ReactNode;
}

export function ComparisonCardShell({
  isSelected,
  isHovered,
  selectedSlotIndex,
  envColor,
  className = "",
  style,
  onMouseEnter,
  onMouseLeave,
  onClick,
  accentBarWidth = "w-0.5",
  children,
}: ComparisonCardShellProps) {
  const selectionColor = isSelected ? ITINERARY_COLORS[selectedSlotIndex] : undefined;

  return (
    <div
      className={`relative rounded-lg border-2 transition-all cursor-pointer ${
        isSelected
          ? "bg-white dark:bg-zinc-900 shadow-lg z-30"
          : isHovered
          ? "border-zinc-400 dark:border-zinc-500 bg-white dark:bg-zinc-800 shadow-sm z-10"
          : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-600 z-0"
      } ${className}`}
      style={{ ...style, borderColor: isSelected ? selectionColor : undefined }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
    >
      {/* Left accent bar showing env color */}
      <div
        className={`absolute left-0 top-0 bottom-0 ${accentBarWidth} rounded-l-lg`}
        style={{ backgroundColor: envColor }}
      />

      {/* FR17: Selection badge — numbered circle */}
      {isSelected && (
        <div
          className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white z-40"
          style={{ backgroundColor: selectionColor }}
        >
          {selectedSlotIndex + 1}
        </div>
      )}

      {children}
    </div>
  );
}
