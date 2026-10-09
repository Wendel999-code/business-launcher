import { Store } from "@/types";
import { initialStore } from "@/data/dummy";
/** Replace this adapter with authenticated Supabase queries and transactional RPCs. */
export interface Repository {
  load(): Store;
  save(store: Store): void;
}
export const demoRepository: Repository = {
  load() {
    try {
      const raw = localStorage.getItem("brew-demo-v1");
      return raw
        ? { ...structuredClone(initialStore), ...JSON.parse(raw) }
        : structuredClone(initialStore);
    } catch {
      return structuredClone(initialStore);
    }
  },
  save(store) {
    localStorage.setItem("brew-demo-v1", JSON.stringify(store));
  },
};
