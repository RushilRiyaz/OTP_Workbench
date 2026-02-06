// Manual localStorage mock for Node test environment

import { vi, beforeEach } from "vitest";

const store = new Map<string, string>();

const localStorageMock = {
  getItem: vi.fn((key: string) => store.get(key) ?? null),
  setItem: vi.fn((key: string, value: string) => {
    store.set(key, value);
  }),
  removeItem: vi.fn((key: string) => {
    store.delete(key);
  }),
  clear: vi.fn(() => {
    store.clear();
  }),
  get length() {
    return store.size;
  },
  key: vi.fn((index: number) => {
    return [...store.keys()][index] ?? null;
  }),
};

// Install on globalThis
Object.defineProperty(globalThis, "localStorage", { value: localStorageMock, writable: true });
// Also ensure `window` exists for SSR checks
Object.defineProperty(globalThis, "window", { value: globalThis, writable: true });

beforeEach(() => {
  store.clear();
  localStorageMock.getItem.mockClear();
  localStorageMock.setItem.mockClear();
  localStorageMock.removeItem.mockClear();
  localStorageMock.clear.mockClear();
});

export { localStorageMock };
