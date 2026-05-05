import '@testing-library/jest-dom/vitest';

// Node 25 surfaces an experimental `localStorage` global that Vitest 4 picks
// up but doesn't initialize with the methods Zustand's persist middleware
// needs (we get a bare `{}` without setItem/getItem/removeItem). Replace
// it with an in-memory shim that satisfies the Storage interface for any
// test that imports a store wrapped in `persist({ name, version })`.
const memStorage: Storage = (() => {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, String(value));
    },
  };
})();

Object.defineProperty(globalThis, 'localStorage', {
  value: memStorage,
  configurable: true,
  writable: true,
});
