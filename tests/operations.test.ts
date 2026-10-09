import test from "node:test";
import assert from "node:assert/strict";
import { applyCommand } from "../lib/operations";
import { initialStore as fixture } from "../data/dummy";
import { normalizeStoredLocations } from "../lib/storage-migrations";
const initialStore = normalizeStoredLocations(fixture);
import { profiles } from "../data/dummy/branches";
const admin = profiles[0],
  downtown = profiles[1],
  riverside = profiles[2];
const quantity = (
  store: typeof initialStore,
  locationId: string,
  productId = "p1",
) =>
  store.inventory.find(
    (x) => x.locationId === locationId && x.productId === productId,
  )!.quantity;
test("dispatch deducts source stock once, and branch receipt adds actual quantities", () => {
  const before = quantity(initialStore, "hq");
  const dispatched = applyCommand(initialStore, admin, {
    type: "transition",
    id: "TR-2026-0107",
    status: "Dispatched",
  });
  assert.equal(quantity(dispatched, "hq"), before - 20);
  assert.equal(
    quantity(dispatched, riverside.branchId),
    quantity(initialStore, riverside.branchId),
  );
  assert.throws(() =>
    applyCommand(dispatched, admin, {
      type: "transition",
      id: "TR-2026-0107",
      status: "Dispatched",
    }),
  );
  const received = applyCommand(dispatched, riverside, {
    type: "transition",
    id: "TR-2026-0107",
    status: "Received",
    quantities: [19, 30, 8],
    remarks: "One kg missing from delivery",
  });
  assert.equal(
    quantity(received, riverside.branchId),
    quantity(initialStore, riverside.branchId) + 19,
  );
  assert.equal(
    received.transfers.find((t) => t.id === "TR-2026-0107")!.status,
    "Received",
  );
  assert.equal(
    received.movements.filter((m) => m.reference === "TR-2026-0107").length,
    6,
  );
  assert.throws(() =>
    applyCommand(received, riverside, {
      type: "transition",
      id: "TR-2026-0107",
      status: "Received",
    }),
  );
  assert.equal(
    quantity(initialStore, "hq"),
    before,
    "Original data must remain unchanged",
  );
});
test("only destination branch can receive and discrepancies require remarks", () => {
  assert.throws(
    () =>
      applyCommand(initialStore, riverside, {
        type: "transition",
        id: "TR-2026-0108",
        status: "Received",
      }),
    /destination|branch/i,
  );
  assert.throws(
    () =>
      applyCommand(initialStore, admin, {
        type: "transition",
        id: "TR-2026-0108",
        status: "Received",
      }),
    /branch account/i,
  );
  assert.throws(
    () =>
      applyCommand(initialStore, downtown, {
        type: "transition",
        id: "TR-2026-0108",
        status: "Received",
        quantities: [19, 40, 10, 500],
      }),
    /remarks/i,
  );
});
test("branch accounts cannot adjust another branch or create transfers", () => {
  assert.throws(
    () =>
      applyCommand(initialStore, downtown, {
        type: "adjust",
        productId: "p1",
        locationId: riverside.branchId,
        quantity: -1,
        reason: "Damaged",
        remarks: "Damage",
      }),
    /outside/i,
  );
  assert.throws(
    () =>
      applyCommand(initialStore, downtown, {
        type: "transfer",
        transfer: { ...initialStore.transfers[1], id: "new" },
      }),
    /Head Office/i,
  );
});
test("failed multi-item dispatch is atomic", () => {
  const store = structuredClone(initialStore);
  store.transfers[1].items[1].quantity = 99999;
  const before = quantity(store, "hq");
  assert.throws(
    () =>
      applyCommand(store, admin, {
        type: "transition",
        id: "TR-2026-0107",
        status: "Dispatched",
      }),
    /Insufficient/i,
  );
  assert.equal(quantity(store, "hq"), before);
  assert.equal(store.transfers[1].status, "Pending");
});
test("adjustments require remarks, reject losses beyond stock, and append history", () => {
  assert.throws(
    () =>
      applyCommand(initialStore, downtown, {
        type: "adjust",
        productId: "p1",
        locationId: downtown.branchId,
        quantity: -1,
        reason: "Damaged",
        remarks: "",
      }),
    /remarks/i,
  );
  assert.throws(
    () =>
      applyCommand(initialStore, downtown, {
        type: "adjust",
        productId: "p1",
        locationId: downtown.branchId,
        quantity: -999,
        reason: "Damaged",
        remarks: "Broken stock",
      }),
    /Insufficient/i,
  );
  const next = applyCommand(initialStore, downtown, {
    type: "adjust",
    productId: "p1",
    locationId: downtown.branchId,
    quantity: -2,
    reason: "Damaged",
    remarks: "Damaged packaging",
  });
  assert.equal(quantity(next, downtown.branchId), 40);
  assert.equal(next.movements[0].quantity, -2);
  assert.equal(next.activity[0].user, downtown.name);
});
test("sales reject mismatched payments, duplicates and cross-branch submissions", () => {
  const sale = { ...initialStore.sales[0], id: "new", date: "2026-08-01" };
  assert.throws(
    () =>
      applyCommand(initialStore, downtown, {
        type: "sale",
        sale: { ...sale, cash: 0 },
      }),
    /Payment/i,
  );
  assert.throws(
    () =>
      applyCommand(initialStore, downtown, {
        type: "sale",
        sale: { ...sale, date: "2026-10-08" },
      }),
    /already/i,
  );
  assert.throws(
    () => applyCommand(initialStore, riverside, { type: "sale", sale }),
    /assigned/i,
  );
  const next = applyCommand(initialStore, downtown, { type: "sale", sale });
  assert.equal(next.sales[0].id, "new");
  assert.equal(next.activity[0].branchId, downtown.branchId);
});
test("draft edits preserve reference and deactivation preserves inventory history", () => {
  const transfer = {
    ...initialStore.transfers[4],
    notes: "Updated delivery notes",
  };
  const next = applyCommand(initialStore, admin, {
    type: "transfer",
    transfer,
  });
  assert.equal(next.transfers.filter((t) => t.id === transfer.id).length, 1);
  assert.equal(next.transfers[0].notes, transfer.notes);
  const updated = applyCommand(next, admin, {
    type: "product",
    product: { ...next.products[0], active: false },
  });
  assert.equal(updated.inventory.length, next.inventory.length);
  assert.deepEqual(updated.movements, next.movements);
});
test("mark all as read changes only notifications assigned to the branch", () => {
  const next = applyCommand(initialStore, downtown, { type: "read" });
  assert.ok(
    next.notifications
      .filter((n) => n.branchId === downtown.branchId)
      .every((n) => n.read),
  );
  assert.equal(next.notifications.find((n) => n.id === "n1")!.read, false);
});
test("physical counts persist zero variance and create adjustments only for differences", () => {
  const counted = applyCommand(initialStore, downtown, {
    type: "count",
    productId: "p1",
    locationId: downtown.branchId,
    physicalQuantity: 42,
    remarks: "",
  });
  assert.equal(counted.counts[0].variance, 0);
  assert.equal(counted.movements.length, initialStore.movements.length);
  assert.throws(
    () =>
      applyCommand(initialStore, downtown, {
        type: "count",
        productId: "p1",
        locationId: downtown.branchId,
        physicalQuantity: 40,
        remarks: "",
      }),
    /remarks/i,
  );
  const adjusted = applyCommand(initialStore, downtown, {
    type: "count",
    productId: "p1",
    locationId: downtown.branchId,
    physicalQuantity: 40,
    remarks: "Two kg variance found during closing count",
  });
  assert.equal(quantity(adjusted, downtown.branchId), 40);
  assert.equal(adjusted.counts[0].variance, -2);
  assert.equal(adjusted.movements[0].type, "Stock Count Correction");
});
