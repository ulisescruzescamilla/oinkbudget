/**
 * Device-level connectivity tracking, backed by `@react-native-community/netinfo`.
 *
 * `isOnline()` is a synchronous, cheap check used to short-circuit an API call
 * before attempting it (avoids a guaranteed timeout with zero connectivity). It
 * intentionally does not get "stuck" after one failed request — every call
 * still independently retries the API whenever the device is connected, which
 * self-heals the "device online, API host down" case without a manual reset.
 */
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

export type NetworkListener = (online: boolean) => void;

let online = true;
let apiHealthy = true;
const listeners = new Set<NetworkListener>();
let unsubscribeNetInfo: (() => void) | null = null;

function deriveOnline(state: NetInfoState): boolean {
  return Boolean(state.isConnected) && state.isInternetReachable !== false;
}

function notify() {
  listeners.forEach((listener) => listener(online));
}

/** Wires up the NetInfo listener. Call once at app startup; returns a teardown function. */
export function initNetworkStatus(): () => void {
  if (unsubscribeNetInfo) return unsubscribeNetInfo;

  NetInfo.fetch().then((state) => {
    online = deriveOnline(state);
    notify();
  });
  unsubscribeNetInfo = NetInfo.addEventListener((state) => {
    const next = deriveOnline(state);
    if (next === online) return;
    online = next;
    notify();
  });

  return () => {
    unsubscribeNetInfo?.();
    unsubscribeNetInfo = null;
  };
}

/**
 * Last-known device connectivity (synchronous). Defaults to `true` until the
 * first NetInfo event arrives. Gates whether a service call even attempts the
 * network — a cheap short-circuit, not a sticky failure flag: every call still
 * independently retries the API whenever the device is connected, which is
 * what self-heals "device online, API host down" without getting stuck.
 */
export function isOnline(): boolean {
  return online;
}

/**
 * Whether the API itself has been reachable on the most recent attempt,
 * independent of device connectivity. UI-status signal only (see
 * `services/syncService.ts`) — never gates routing decisions.
 */
export function isApiHealthy(): boolean {
  return apiHealthy;
}

/** Subscribes to changes in device connectivity or API health. Returns an unsubscribe function. */
export function subscribeNetwork(listener: NetworkListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Lets a service call record whether the API itself is currently reachable,
 * independent of device connectivity (e.g. device online but the API host is
 * down). Feeds the UI status only — see `services/syncService.ts`.
 */
export function recordApiOutcome(success: boolean) {
  if (success === apiHealthy) return;
  apiHealthy = success;
  notify();
}
