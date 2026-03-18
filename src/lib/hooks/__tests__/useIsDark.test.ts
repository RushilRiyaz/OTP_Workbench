// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { renderHook, act, cleanup } from "@testing-library/react";
import { useIsDark } from "@/lib/hooks/useIsDark";

// Mock matchMedia (jsdom doesn't implement it)
function mockMatchMedia(matches: boolean) {
  type ChangeListener = (e: { matches: boolean }) => void;
  const listeners: ChangeListener[] = [];
  const mq = {
    matches,
    addEventListener: (_event: string, cb: ChangeListener) => {
      listeners.push(cb);
    },
    removeEventListener: (_event: string, cb: ChangeListener) => {
      const i = listeners.indexOf(cb);
      if (i >= 0) listeners.splice(i, 1);
    },
    _fire: (newMatches: boolean) => {
      mq.matches = newMatches;
      listeners.forEach((cb) => cb({ matches: newMatches }));
    },
  };
  Object.defineProperty(window, "matchMedia", {
    value: () => mq,
    writable: true,
    configurable: true,
  });
  return mq;
}

describe("useIsDark", () => {
  afterEach(() => {
    document.documentElement.className = "";
    cleanup();
  });

  it("returns false when no dark class and prefers-color-scheme is light", () => {
    mockMatchMedia(false);
    document.documentElement.className = "";
    const { result } = renderHook(() => useIsDark());
    expect(result.current).toBe(false);
  });

  it("returns true when html has 'dark' class", () => {
    mockMatchMedia(false);
    document.documentElement.className = "dark";
    const { result } = renderHook(() => useIsDark());
    expect(result.current).toBe(true);
  });

  it("returns true when prefers-color-scheme is dark (no class override)", () => {
    mockMatchMedia(true);
    document.documentElement.className = "";
    const { result } = renderHook(() => useIsDark());
    expect(result.current).toBe(true);
  });

  it("returns false when prefers-color-scheme is dark but 'light' class present", () => {
    mockMatchMedia(true);
    document.documentElement.className = "light";
    const { result } = renderHook(() => useIsDark());
    expect(result.current).toBe(false);
  });

  it("reacts to class attribute changes via MutationObserver", async () => {
    mockMatchMedia(false);
    document.documentElement.className = "";
    const { result } = renderHook(() => useIsDark());
    expect(result.current).toBe(false);

    // MutationObserver in jsdom fires async via microtask
    await act(async () => {
      document.documentElement.classList.add("dark");
      // Allow MutationObserver callback to fire
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(result.current).toBe(true);
  });

  it("reacts to matchMedia change events", () => {
    const mq = mockMatchMedia(false);
    document.documentElement.className = "";
    const { result } = renderHook(() => useIsDark());
    expect(result.current).toBe(false);

    act(() => {
      mq._fire(true);
    });
    expect(result.current).toBe(true);
  });
});
