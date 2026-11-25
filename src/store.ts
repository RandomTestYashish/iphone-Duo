import { useSyncExternalStore } from "react";
import type { DetailSpec } from "@/components/Overlays";

/**
 * App state shared by every rendering of the screen. During a fold animation the outer display and
 * both halves of the inner display are drawn at once, so they all read the same state (continuity).
 */
export type Pack = { price: number; days: number; data: string; till: string };
type State = { tab: string; nav: string; pack: Pack | null; detail: DetailSpec | null; ratio: number };

let state: State = { tab: "All", nav: "Manage", pack: null, detail: null, ratio: 0 };
const subs = new Set<() => void>();

export const store = {
  get: () => state,
  set(patch: Partial<State>) {
    state = { ...state, ...patch };
    subs.forEach((f) => f());
  },
  /** Scroll position is shared without re-rendering anyone. */
  setRatio(r: number) {
    state.ratio = r;
  },
  subscribe(f: () => void) {
    subs.add(f);
    return () => void subs.delete(f);
  },
};

export function useStore<T>(pick: (s: State) => T): T {
  return useSyncExternalStore(store.subscribe, () => pick(state));
}
