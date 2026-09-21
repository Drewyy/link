// Stand-in for the in-chat window.storage API, backed by the browser's localStorage.
// Limitation: this is per-browser, per-device. A user who saves a forge on their
// laptop won't see it on their phone. If you outgrow that, swap this file's
// internals for calls to a real database (e.g. Supabase, Firebase) — nothing
// else in the app needs to change, since the function signatures stay the same.

const PREFIX = "kiln:";

export const storage = {
  async get(key) {
    const raw = window.localStorage.getItem(PREFIX + key);
    if (raw === null) throw new Error("Key not found: " + key);
    return { key, value: raw };
  },
  async set(key, value) {
    window.localStorage.setItem(PREFIX + key, value);
    return { key, value };
  },
  async delete(key) {
    window.localStorage.removeItem(PREFIX + key);
    return { key, deleted: true };
  },
  async list(prefix = "") {
    const keys = Object.keys(window.localStorage)
      .filter((k) => k.startsWith(PREFIX + prefix))
      .map((k) => k.slice(PREFIX.length));
    return { keys };
  },
};
