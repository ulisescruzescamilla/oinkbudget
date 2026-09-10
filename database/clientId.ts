/**
 * Generates a client-side identifier for offline-created records.
 * Pure-JS RFC4122-v4-shaped UUID — no `expo-crypto` dependency, since this
 * value is only used for local dedupe/FK matching, not cryptographic purposes.
 */
export function generateClientId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
