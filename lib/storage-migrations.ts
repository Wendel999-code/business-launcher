import { Store } from "@/types";
import { branches } from "@/data/dummy/branches";

export function resolveLocation(id: string): string {
  if (id === "hq" || branches.some((b) => b.id === id)) return id;
  const index = ["downtown", "riverside", "uptown"].indexOf(id);
  return index < 0 ? id : (branches[index]?.id ?? id);
}

export function normalizeStoredLocations(source: Store): Store {
  const store = structuredClone(source);
  const inventory = new Map<string, Store["inventory"][number]>();
  for (const row of store.inventory) {
    row.locationId = resolveLocation(row.locationId);
    const key = `${row.locationId}:${row.productId}`;
    const previous = inventory.get(key);
    if (previous) previous.quantity += row.quantity;
    else inventory.set(key, row);
  }
  store.inventory = [...inventory.values()];
  for (const row of [
    ...store.sales,
    ...store.transfers,
    ...store.notifications,
    ...store.activity,
  ])
    row.branchId = resolveLocation(row.branchId);
  for (const row of [...store.movements, ...store.counts])
    row.locationId = resolveLocation(row.locationId);
  return store;
}
