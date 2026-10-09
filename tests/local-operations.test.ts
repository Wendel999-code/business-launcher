import test from "node:test";
import assert from "node:assert/strict";
import { demoRepository, STORAGE_KEY } from "../lib/repository";
import { profiles, branches } from "../data/dummy/branches";
import { emptyStore } from "../data/initial-state";
import { Product, Sale, Store } from "../types";
import { TODAY } from "../lib/utils";
import { initialStore } from "../data/dummy";

class MemoryStorage implements Storage {
  values = new Map<string, string>();
  get length() {
    return this.values.size;
  }
  clear() {
    this.values.clear();
  }
  getItem(key: string) {
    return this.values.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.values.set(key, String(value));
  }
  removeItem(key: string) {
    this.values.delete(key);
  }
  key(index: number) {
    return [...this.values.keys()][index] ?? null;
  }
}
const admin = profiles[0],
  branch = profiles[1];
const product: Product = {
  id: "arabica-local",
  sku: "BEAN-LOCAL",
  name: "Arabica Coffee Beans",
  unit: "kg",
  category: "Coffee Beans",
  cost: 100,
  minimum: 18,
  reorder: 25,
  active: true,
  inventoryTracked: true,
};
const quantity = (s: Store, locationId: string, id = product.id) =>
  s.inventory.find((i) => i.locationId === locationId && i.productId === id)!
    .quantity;
function setup(t: test.TestContext) {
  const old = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  const storage = new MemoryStorage();
  Object.defineProperty(globalThis, "localStorage", {
    value: storage,
    configurable: true,
  });
  t.after(() => {
    if (old) Object.defineProperty(globalThis, "localStorage", old);
    else Reflect.deleteProperty(globalThis, "localStorage");
  });
  return storage;
}
function supplied() {
  demoRepository.commit(admin, {
    type: "product",
    product,
    openingQuantity: 100,
  });
  demoRepository.commit(admin, {
    type: "transfer",
    transfer: {
      id: "LOCAL-TR",
      branchId: branch.branchId,
      date: TODAY,
      status: "Pending",
      items: [{ productId: product.id, quantity: 20 }],
      notes: "Supply branch",
      user: admin.name,
    },
  });
  demoRepository.commit(admin, {
    type: "transition",
    id: "LOCAL-TR",
    status: "Dispatched",
  });
  return demoRepository.commit(branch, {
    type: "transition",
    id: "LOCAL-TR",
    status: "Received",
    quantities: [20],
  });
}
const sale = (
  items: Sale["items"],
  status: Sale["status"] = "Submitted",
): Sale => ({
  id: "LOCAL-SALE",
  branchId: branch.branchId,
  date: TODAY,
  gross: 300,
  discounts: 0,
  transactions: 1,
  cash: 300,
  wallet: 0,
  card: 0,
  user: branch.name,
  status,
  items,
});

test("complete persisted workflow: opening 100 → dispatch 80/0 → receive 80/20 → sale 17 → damage 15 → reload", (t) => {
  const storage = setup(t);
  assert.deepEqual(demoRepository.load(), emptyStore);
  assert.ok(storage.getItem(STORAGE_KEY));
  const opened = demoRepository.commit(admin, {
    type: "product",
    product,
    openingQuantity: 100,
  });
  assert.equal(quantity(opened, "hq"), 100);
  assert.equal(quantity(opened, branch.branchId), 0);
  assert.equal(opened.movements[0].type, "Stock Received");
  demoRepository.commit(admin, {
    type: "transfer",
    transfer: {
      id: "LOCAL-TR",
      branchId: branch.branchId,
      date: TODAY,
      status: "Pending",
      items: [{ productId: product.id, quantity: 20 }],
      notes: "Supply branch",
      user: admin.name,
    },
  });
  const dispatched = demoRepository.commit(admin, {
    type: "transition",
    id: "LOCAL-TR",
    status: "Dispatched",
  });
  assert.equal(quantity(dispatched, "hq"), 80);
  assert.equal(quantity(dispatched, branch.branchId), 0);
  const received = demoRepository.commit(branch, {
    type: "transition",
    id: "LOCAL-TR",
    status: "Received",
    quantities: [20],
  });
  assert.equal(quantity(received, branch.branchId), 20);
  assert.equal(received.transfers[0].status, "Received");
  const sold = demoRepository.commit(branch, {
    type: "sale",
    sale: sale([{ productId: product.id, quantity: 3, kind: "Sold" }]),
  });
  assert.equal(quantity(sold, branch.branchId), 17);
  const damaged = demoRepository.commit(branch, {
    type: "adjust",
    productId: product.id,
    locationId: branch.branchId,
    quantity: -2,
    reason: "Damaged",
    remarks: "Two units damaged",
  });
  assert.equal(quantity(damaged, branch.branchId), 15);
  assert.equal(quantity(damaged, "hq"), 80);
  assert.equal(damaged.sales.length, 1);
  assert.equal(damaged.movements.length, 5);
  assert.equal(damaged.activity.length, 6);
  assert.deepEqual(demoRepository.load(), damaged);
  assert.deepEqual(JSON.parse(storage.getItem(STORAGE_KEY)!), damaged);
});
test("sales drafts do not deduct, submitting deducts once, edits apply differences, and overselling leaves storage unchanged", (t) => {
  const storage = setup(t);
  supplied();
  const items = [
    { productId: product.id, quantity: 3, kind: "Consumed" as const },
  ];
  let s = demoRepository.commit(branch, {
    type: "sale",
    sale: sale(items, "Draft"),
  });
  assert.equal(quantity(s, branch.branchId), 20);
  s = demoRepository.commit(branch, { type: "sale", sale: sale(items) });
  assert.equal(quantity(s, branch.branchId), 17);
  s = demoRepository.commit(branch, { type: "sale", sale: sale(items) });
  assert.equal(quantity(s, branch.branchId), 17);
  assert.equal(
    s.movements.filter((m) => m.reference === "LOCAL-SALE").length,
    1,
  );
  s = demoRepository.commit(branch, {
    type: "sale",
    sale: sale([{ ...items[0], quantity: 5 }]),
  });
  assert.equal(quantity(s, branch.branchId), 15);
  s = demoRepository.commit(branch, {
    type: "sale",
    sale: sale([{ ...items[0], quantity: 2 }]),
  });
  assert.equal(quantity(s, branch.branchId), 18);
  assert.equal(s.movements[0].type, "Sales Correction");
  const before = storage.getItem(STORAGE_KEY);
  assert.throws(
    () =>
      demoRepository.commit(branch, {
        type: "sale",
        sale: sale([{ ...items[0], quantity: 30 }]),
      }),
    /Insufficient/,
  );
  assert.equal(storage.getItem(STORAGE_KEY), before);
  assert.throws(
    () =>
      demoRepository.commit(branch, {
        type: "sale",
        sale: sale(items, "Draft"),
      }),
    /Submitted sales/,
  );
});
test("piece-based stock deducts 20 → 17, and multi-product overselling is atomic", (t) => {
  const storage = setup(t);
  supplied();
  const cups = {
    ...product,
    id: "cups",
    sku: "CUP-LOCAL",
    name: "Paper Cups",
    unit: "pcs",
  };
  demoRepository.commit(admin, {
    type: "product",
    product: cups,
    openingQuantity: 20,
  });
  demoRepository.commit(admin, {
    type: "transfer",
    transfer: {
      id: "CUPS-TR",
      branchId: branch.branchId,
      date: TODAY,
      status: "Pending",
      items: [{ productId: cups.id, quantity: 20 }],
      notes: "",
      user: admin.name,
    },
  });
  demoRepository.commit(admin, {
    type: "transition",
    id: "CUPS-TR",
    status: "Dispatched",
  });
  demoRepository.commit(branch, {
    type: "transition",
    id: "CUPS-TR",
    status: "Received",
  });
  const s = demoRepository.commit(branch, {
    type: "sale",
    sale: sale([{ productId: cups.id, quantity: 3, kind: "Sold" }]),
  });
  assert.equal(quantity(s, branch.branchId, cups.id), 17);
  const before = storage.getItem(STORAGE_KEY);
  assert.throws(
    () =>
      demoRepository.commit(branch, {
        type: "sale",
        sale: sale([
          { productId: cups.id, quantity: 4, kind: "Sold" },
          { productId: product.id, quantity: 99, kind: "Consumed" },
        ]),
      }),
    /Insufficient/,
  );
  assert.equal(storage.getItem(STORAGE_KEY), before);
});
test("opening quantities reject negative stock and cannot silently replace an existing balance", (t) => {
  setup(t);
  assert.throws(
    () =>
      demoRepository.commit(admin, {
        type: "product",
        product,
        openingQuantity: -1,
      }),
    /Opening/,
  );
  assert.deepEqual(demoRepository.load(), emptyStore);
  demoRepository.commit(admin, {
    type: "product",
    product,
    openingQuantity: 100,
  });
  assert.throws(
    () =>
      demoRepository.commit(admin, {
        type: "product",
        product,
        openingQuantity: 200,
      }),
    /Opening/,
  );
  assert.equal(quantity(demoRepository.load(), "hq"), 100);
});
test("legacy records survive migration and corrupted storage is never overwritten", (t) => {
  const storage = setup(t);
  storage.setItem(STORAGE_KEY, JSON.stringify(initialStore));
  const loaded = demoRepository.load();
  assert.equal(loaded.sales.length, initialStore.sales.length);
  assert.ok(loaded.inventory.some((i) => i.locationId === branches[0].id));
  storage.setItem(STORAGE_KEY, "corrupt saved data");
  assert.throws(() => demoRepository.load(), /preserved/);
  assert.throws(
    () =>
      demoRepository.commit(admin, {
        type: "product",
        product,
        openingQuantity: 100,
      }),
    /preserved/,
  );
  assert.equal(storage.getItem(STORAGE_KEY), "corrupt saved data");
});
test("fresh reads prevent stale-state overwrites and failed persistence does not commit", (t) => {
  const storage = setup(t);
  const stale = demoRepository.load();
  supplied();
  assert.equal(stale.products.length, 0);
  demoRepository.commit(branch, {
    type: "adjust",
    productId: product.id,
    locationId: branch.branchId,
    quantity: -2,
    reason: "Damaged",
    remarks: "Broken units",
  });
  assert.equal(quantity(demoRepository.load(), branch.branchId), 18);
  const before = storage.getItem(STORAGE_KEY);
  storage.setItem = () => {
    throw new Error("Storage quota exceeded");
  };
  assert.throws(
    () =>
      demoRepository.commit(branch, {
        type: "adjust",
        productId: product.id,
        locationId: branch.branchId,
        quantity: -1,
        reason: "Damaged",
        remarks: "Damage",
      }),
    /quota/,
  );
  assert.equal(storage.getItem(STORAGE_KEY), before);
});
