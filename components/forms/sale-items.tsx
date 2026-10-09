"use client";
import { Plus, Trash2 } from "lucide-react";
import { useApp } from "@/components/providers";
import { SaleItem, Sale } from "@/types";

export function SaleItems({
  items,
  onChange,
  branchId,
  previous,
}: {
  items: SaleItem[];
  onChange: (items: SaleItem[]) => void;
  branchId: string;
  previous?: Sale;
}) {
  const { store } = useApp();
  const products = store.products.filter(
    (p) =>
      p.inventoryTracked !== false &&
      (p.active || items.some((i) => i.productId === p.id)),
  );
  return (
    <section className="sale-inventory-items">
      <div className="form-section-label">
        <h3>Inventory sold or consumed</h3>
        <span>Optional for untracked sales</span>
      </div>
      <p className="field-help">
        Submitted sales deduct these quantities from this branch. Drafts do not
        change stock. Editing a submitted report applies only the quantity
        difference.
      </p>
      {items.map((item, index) => {
        const product = store.products.find((p) => p.id === item.productId);
        const available =
          store.inventory.find(
            (x) => x.locationId === branchId && x.productId === item.productId,
          )?.quantity ?? 0;
        const previouslyDeducted =
          previous?.status === "Submitted" && previous.branchId === branchId
            ? (previous.items?.find((i) => i.productId === item.productId)
                ?.quantity ?? 0)
            : 0;
        const replace = (patch: Partial<SaleItem>) =>
          onChange(items.map((i, j) => (j === index ? { ...i, ...patch } : i)));
        return (
          <div className="transfer-form-row sale-item-row" key={index}>
            <label className="grow">
              Tracked product
              <select
                value={item.productId}
                onChange={(e) => replace({ productId: e.target.value })}
                required
              >
                <option value="" disabled>
                  Select a product
                </option>
                {products
                  .filter(
                    (p) =>
                      p.id === item.productId ||
                      !items.some((i) => i.productId === p.id),
                  )
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
              </select>
              <small>
                {available} {product?.unit} available
                {previouslyDeducted > 0
                  ? ` · ${previouslyDeducted} previously recorded`
                  : ""}
              </small>
            </label>
            <label className="sale-kind">
              Use
              <select
                value={item.kind}
                onChange={(e) =>
                  replace({ kind: e.target.value as SaleItem["kind"] })
                }
              >
                <option>Sold</option>
                <option>Consumed</option>
              </select>
            </label>
            <label>
              Quantity ({product?.unit ?? "units"})
              <input
                type="number"
                step="any"
                min="0.000001"
                required
                value={item.quantity}
                onChange={(e) => replace({ quantity: Number(e.target.value) })}
              />
              <small>
                After submission:{" "}
                {Math.round(
                  (available + previouslyDeducted - item.quantity) * 1e6,
                ) / 1e6}{" "}
                {product?.unit}
              </small>
            </label>
            <button
              type="button"
              className="icon-button"
              aria-label="Remove sales item"
              onClick={() => onChange(items.filter((_, i) => i !== index))}
            >
              <Trash2 size={16} />
            </button>
          </div>
        );
      })}
      <button
        type="button"
        className="button secondary small"
        disabled={
          !products.some(
            (p) => p.active && !items.some((i) => i.productId === p.id),
          )
        }
        onClick={() =>
          onChange([
            ...items,
            {
              productId: products.find(
                (p) => p.active && !items.some((i) => i.productId === p.id),
              )!.id,
              quantity: 1,
              kind: "Sold",
            },
          ])
        }
      >
        <Plus size={14} />
        Add inventory item
      </button>
      {!products.length && (
        <p className="field-help">
          Head Office must add a tracked product and deliver branch stock before
          inventory can be consumed.
        </p>
      )}
    </section>
  );
}
