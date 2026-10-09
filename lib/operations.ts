import { Store, Profile, Transfer, Sale, Movement, Product } from "@/types";
import { canAccessLocation } from "./permissions";
import { TODAY } from "./utils";
import { branches } from "@/data/dummy/branches";
export type Command =
  | { type: "transfer"; transfer: Transfer }
  | {
      type: "transition";
      id: string;
      status: Transfer["status"];
      quantities?: number[];
      remarks?: string;
    }
  | { type: "sale"; sale: Sale }
  | {
      type: "adjust";
      productId: string;
      locationId: string;
      quantity: number;
      reason: string;
      remarks: string;
    }
  | {
      type: "count";
      productId: string;
      locationId: string;
      physicalQuantity: number;
      remarks: string;
    }
  | { type: "product"; product: Product; openingQuantity?: number }
  | { type: "read"; id?: string };
export function applyCommand(
  original: Store,
  profile: Profile,
  command: Command,
): Store {
  const store = structuredClone(original);
  const now = new Date().toISOString();
  const uid = () => crypto.randomUUID();
  function audit(
    action: string,
    module: string,
    reference: string,
    branchId = profile.branchId,
  ) {
    store.activity.unshift({
      id: uid(),
      branchId,
      date: now,
      user: profile.name,
      role: profile.role,
      action,
      module,
      reference,
    });
  }
  function move(
    productId: string,
    locationId: string,
    quantity: number,
    type: string,
    reference: string,
    remarks: string,
  ) {
    if (!Number.isFinite(quantity)) throw new Error("Enter a valid quantity.");
    const stock = store.inventory.find(
      (x) => x.productId === productId && x.locationId === locationId,
    );
    const balance = Math.round(((stock?.quantity ?? 0) + quantity) * 1e6) / 1e6;
    if (!stock || balance < 0)
      throw new Error("Insufficient stock for this operation.");
    stock.quantity = balance;
    stock.updatedAt = TODAY;
    const movement: Movement = {
      id: uid(),
      productId,
      locationId,
      quantity,
      type,
      reference,
      date: now,
      user: profile.name,
      remarks,
    };
    store.movements.unshift(movement);
  }
  if (command.type === "transfer") {
    if (profile.role !== "admin")
      throw new Error("Only Head Office can create transfers.");
    if (!branches.some(b => b.id === command.transfer.branchId) ||
      !["Draft", "Pending"].includes(command.transfer.status) || !command.transfer.id.trim())
      throw new Error("Choose a valid destination and create a draft or pending transfer.");
    if (
      !command.transfer.items.length ||
      new Set(command.transfer.items.map((x) => x.productId)).size !==
        command.transfer.items.length
    )
      throw new Error("Choose unique products for the transfer.");
    for (const item of command.transfer.items) {
      if (
        !store.products.find((p) => p.id === item.productId && p.active) ||
        !Number.isFinite(item.quantity) ||
        item.quantity <= 0
      )
        throw new Error("Choose an active product and a positive quantity.");
      if (
        item.quantity >
        (store.inventory.find(
          (x) => x.productId === item.productId && x.locationId === "hq",
        )?.quantity ?? 0)
      )
        throw new Error("The requested quantity exceeds Head Office stock.");
    }
    const previous = store.transfers.find((t) => t.id === command.transfer.id);
    if (previous && previous.status !== "Draft")
      throw new Error("Only draft transfers can be edited.");
    store.transfers = store.transfers.filter(
      (t) => t.id !== command.transfer.id,
    );
    store.transfers.unshift(command.transfer);
    audit(
      `${previous ? "Updated" : "Created"} transfer to ${command.transfer.branchId}`,
      "Stock Transfers",
      command.transfer.id,
    );
  } else if (command.type === "transition") {
    const tr = store.transfers.find((t) => t.id === command.id);
    if (!tr) throw new Error("Transfer not found.");
    const allowed: Record<string, string[]> = {
      Draft: ["Pending", "Cancelled"],
      Pending: ["Dispatched", "Cancelled"],
      Dispatched: ["In Transit", "Received"],
      "In Transit": ["Received"],
    };
    if (!allowed[tr.status]?.includes(command.status))
      throw new Error("This transfer can no longer perform that action.");
    if (command.status === "Received") {
      if (profile.role === "admin" || profile.branchId !== tr.branchId)
        throw new Error(
          "Switch to the destination branch account to confirm receipt.",
        );
      const quantities = command.quantities ?? tr.items.map((x) => x.quantity);
      if (
        quantities.length !== tr.items.length ||
        quantities.some(
          (q, i) => !Number.isFinite(q) || q < 0 || q > tr.items[i].quantity,
        )
      )
        throw new Error(
          "Received quantities must be between zero and the dispatched quantity.",
        );
      if (
        quantities.some((q, i) => q !== tr.items[i].quantity) &&
        !command.remarks?.trim()
      )
        throw new Error("Remarks are required for a receiving discrepancy.");
      tr.items.forEach((x, i) => {
        x.received = quantities[i];
        move(
          x.productId,
          tr.branchId,
          quantities[i],
          "Transfer In",
          tr.id,
          command.remarks || "Received in full",
        );
      });
      tr.receivedBy = profile.name;
      tr.receivedAt = TODAY;
      tr.notes += command.remarks ? ` | Receiving: ${command.remarks}` : "";
    } else {
      if (profile.role !== "admin")
        throw new Error("Only Head Office can dispatch or cancel transfers.");
      if (command.status === "Dispatched")
        tr.items.forEach((x) =>
          move(
            x.productId,
            "hq",
            -x.quantity,
            "Transfer Out",
            tr.id,
            `Dispatched to ${tr.branchId}`,
          ),
        );
    }
    tr.status = command.status;
    audit(
      `Transfer ${command.status.toLowerCase()}`,
      "Stock Transfers",
      tr.id,
      tr.branchId,
    );
    store.notifications.unshift({
      id: uid(),
      branchId: tr.branchId,
      title: `Transfer ${tr.id} was ${command.status.toLowerCase()}.`,
      category: "Transfers",
      time: "Just now",
      read: false,
    });
  } else if (command.type === "sale") {
    const s = command.sale;
    if (!canAccessLocation(profile, s.branchId) || !branches.some(b => b.id === s.branchId))
      throw new Error("Choose your assigned branch.");
    if (
      [s.gross, s.discounts, s.transactions, s.cash, s.wallet, s.card].some(
        (n) => !Number.isFinite(n) || n < 0,
      ) ||
      s.discounts > s.gross ||
      !Number.isInteger(s.transactions)
    )
      throw new Error("Check the sales amounts and transaction count.");
    if (
      s.status === "Submitted" &&
      Math.abs(s.cash + s.wallet + s.card - (s.gross - s.discounts)) > 0.01
    )
      throw new Error("Payment breakdown must equal net sales.");
    if (
      store.sales.some(
        (x) =>
          x.id !== s.id &&
          x.branchId === s.branchId &&
          x.date === s.date &&
          x.status === "Submitted",
      )
    )
      throw new Error(
        "A sales report has already been submitted for this branch and date.",
      );
    const previous = store.sales.find((x) => x.id === s.id);
    if (previous && !canAccessLocation(profile, previous.branchId))
      throw new Error("This report belongs to another branch.");
    if (previous?.status === "Submitted" &&
      (s.status === "Draft" || previous.branchId !== s.branchId || previous.date !== s.date))
      throw new Error("Submitted sales must keep their branch, reporting date and submitted status.");
    const items = s.items ?? [];
    if (new Set(items.map(i => i.productId)).size !== items.length)
      throw new Error("Choose each inventory product only once.");
    for (const item of items) {
      const p = store.products.find(p => p.id === item.productId);
      const unchanged = previous?.items?.find(i => i.productId === item.productId);
      if (!p || p.inventoryTracked === false || (!p.active && (!unchanged || unchanged.quantity !== item.quantity)) ||
        !Number.isFinite(item.quantity) || item.quantity <= 0 || !["Sold", "Consumed"].includes(item.kind))
        throw new Error("Choose an active tracked product and a positive quantity sold or consumed.");
    }
    if (s.status === "Submitted") {
      const oldItems = previous?.status === "Submitted" ? previous.items ?? [] : [];
      const productIds = new Set([...oldItems, ...items].map(i => i.productId));
      for (const productId of productIds) {
        const oldQuantity = oldItems.find(i => i.productId === productId)?.quantity ?? 0;
        const item = items.find(i => i.productId === productId);
        const difference = oldQuantity - (item?.quantity ?? 0);
        if (difference !== 0) move(productId, s.branchId, difference,
          difference > 0 ? "Sales Correction" : item?.kind === "Consumed" ? "Consumption" : "Sale",
          s.id, `${previous ? "Updated" : "Submitted"} sales report: ${item?.kind ?? "Removed item"}`);
      }
    }
    store.sales = store.sales.filter((x) => x.id !== s.id);
    store.sales.unshift(s);
    audit(
      `${previous ? "Updated daily sales from " + (previous.gross - previous.discounts) + " to " + (s.gross - s.discounts) : s.status === "Draft" ? "Saved draft" : "Submitted daily sales"}`,
      "Sales",
      s.id,
      s.branchId,
    );
  } else if (command.type === "adjust") {
    if (!canAccessLocation(profile, command.locationId))
      throw new Error("This location is outside your branch.");
    if (!command.remarks.trim() || !command.reason || command.quantity === 0)
      throw new Error(
        "A non-zero adjustment, reason and remarks are required.",
      );
    if (
      ["Wastage", "Damaged", "Spillage", "Missing"].includes(command.reason) &&
      command.quantity > 0
    )
      throw new Error(
        "Loss adjustments must reduce stock. Use Stock Count Correction to add stock.",
      );
    const reference = `${command.reason === "Wastage" ? "WST" : "ADJ"}-${uid().slice(0, 8)}`;
    move(
      command.productId,
      command.locationId,
      command.quantity,
      command.reason,
      reference,
      command.remarks,
    );
    audit(
      `Recorded ${command.reason.toLowerCase()} (${command.quantity})`,
      "Inventory",
      reference,
      command.locationId,
    );
  } else if (command.type === "count") {
    if (!canAccessLocation(profile, command.locationId))
      throw new Error("This location is outside your branch.");
    const current = store.inventory.find(
      (x) =>
        x.productId === command.productId &&
        x.locationId === command.locationId,
    );
    if (
      !current ||
      !Number.isFinite(command.physicalQuantity) ||
      command.physicalQuantity < 0
    )
      throw new Error("Enter a valid physical quantity.");
    const variance = command.physicalQuantity - current.quantity;
    if (variance !== 0 && !command.remarks.trim())
      throw new Error(
        "Remarks are required when the stock count has a variance.",
      );
    const id = `CNT-${uid().slice(0, 8)}`;
    store.counts.unshift({
      id,
      productId: command.productId,
      locationId: command.locationId,
      date: TODAY,
      systemQuantity: current.quantity,
      physicalQuantity: command.physicalQuantity,
      variance,
      remarks: command.remarks,
      user: profile.name,
    });
    if (variance !== 0)
      move(
        command.productId,
        command.locationId,
        variance,
        "Stock Count Correction",
        id,
        command.remarks,
      );
    audit(
      `Completed physical count, variance ${variance}`,
      "Inventory",
      id,
      command.locationId,
    );
  } else if (command.type === "product") {
    if (profile.role !== "admin")
      throw new Error("Only Head Office can manage products.");
    const p = command.product;
    if (
      !p.name.trim() ||
      !p.sku.trim() ||
      [p.minimum, p.reorder, p.cost].some(
        (n) => !Number.isFinite(n) || n < 0,
      ) ||
      p.reorder < p.minimum
    )
      throw new Error(
        "Enter product details and a reorder level at least equal to minimum stock.",
      );
    if (
      store.products.some(
        (x) => x.id !== p.id && x.sku.toLowerCase() === p.sku.toLowerCase(),
      )
    )
      throw new Error("This SKU already exists.");
    const existing = store.products.find((x) => x.id === p.id);
    const opening = command.openingQuantity ?? 0;
    if (!Number.isFinite(opening) || opening < 0 || existing && opening !== 0)
      throw new Error("Opening stock must be non-negative and can only be entered when adding a product.");
    store.products = store.products.filter((x) => x.id !== p.id);
    store.products.push(p);
    if (!existing)
      ["hq", ...branches.map(b => b.id)].forEach((locationId) =>
        store.inventory.push({
          productId: p.id,
          locationId,
          quantity: 0,
          updatedAt: TODAY,
        }),
      );
    if (!existing && opening > 0) move(p.id, "hq", opening, "Stock Received", p.sku, "Opening Head Office inventory");
    audit(
      `${existing ? "Updated" : "Created"} product ${p.name}`,
      "Products",
      p.sku,
    );
  } else if (command.type === "read") {
    store.notifications.forEach((n) => {
      if (
        canAccessLocation(profile, n.branchId) &&
        (!command.id || command.id === n.id)
      )
        n.read = true;
    });
  }
  return store;
}
