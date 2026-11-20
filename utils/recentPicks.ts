/**
 * Most recently used options per picker, persisted on the device so
 * `PillPicker` can surface them first across sessions. Ported from the
 * `oink.recent.v1` store in `design/src/picker.jsx`.
 */
import Storage from 'expo-sqlite/kv-store';

const STORAGE_KEY = 'oink.recent.v1';

/** How many recent ids are kept per picker. */
const MAX_RECENT = 6;

type RecentPicks = Record<string, number[]>;

/** Reads the whole store; a missing or corrupt entry counts as empty. */
function readAll(): RecentPicks {
  try {
    return JSON.parse(Storage.getItemSync(STORAGE_KEY) ?? '{}') ?? {};
  } catch {
    return {};
  }
}

/**
 * Returns the recently picked ids of a picker, newest first.
 *
 * @param key - Picker identifier
 */
export function readRecentPicks(key: string): number[] {
  return readAll()[key] ?? [];
}

/**
 * Moves an id to the front of a picker's recent list. Recents are only a
 * convenience, so a storage failure is ignored.
 *
 * @param key - Picker identifier
 * @param id - The picked option
 */
export function pushRecentPick(key: string, id: number): void {
  try {
    const all = readAll();
    all[key] = [id, ...(all[key] ?? []).filter((x) => x !== id)].slice(0, MAX_RECENT);
    Storage.setItemSync(STORAGE_KEY, JSON.stringify(all));
  } catch {}
}
