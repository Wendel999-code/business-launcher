import { Store } from "@/types";
import { emptyStore } from "@/data/initial-state";
import { applyCommand, Command } from "./operations";
import { Profile } from "@/types";
import { normalizeStoredLocations } from "./storage-migrations";
export const STORAGE_KEY = "brew-demo-v1";
/** Replace this adapter with authenticated Supabase queries and transactional RPCs. */
export interface Repository {
  load(): Store;
  save(store: Store): void;
  commit(profile: Profile, command: Command): Store;
}
export const demoRepository: Repository = {
  load() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      const store = structuredClone(emptyStore);
      this.save(store);
      return store;
    }
    let parsed: Partial<Store>;
    try { parsed = JSON.parse(raw); } catch {
      throw new Error("Saved workspace data could not be read. Existing storage has been preserved.");
    }
    if (!parsed || typeof parsed !== "object" || Object.keys(emptyStore).some(key =>
      key !== "counts" && !Array.isArray(parsed[key as keyof Store]))) {
      throw new Error("Saved workspace data is invalid. Existing storage has been preserved.");
    }
    const store = { ...structuredClone(emptyStore), ...parsed } as Store;
    if (!Array.isArray(store.counts)) store.counts = [];
    return normalizeStoredLocations(store);
  },
  save(store) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  },
  commit(profile, command) {
    const next = applyCommand(this.load(), profile, command);
    this.save(next);
    return next;
  },
};
