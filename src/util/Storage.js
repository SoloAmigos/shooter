// Thin wrapper around localStorage with JSON + safe fallbacks.

export const Storage = {
  load(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return structuredClone(fallback);
      return { ...structuredClone(fallback), ...JSON.parse(raw) };
    } catch (e) {
      return structuredClone(fallback);
    }
  },

  save(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      /* storage might be full or blocked; fail silently */
    }
  },

  clear(key) {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      /* noop */
    }
  },
};
