"use client";
import { useState } from "react";
import { useApp } from "@/components/providers";
import { Product } from "@/types";
export function ProductForm({
  onClose,
  product,
}: {
  onClose: () => void;
  product?: Product;
}) {
  const { execute } = useApp();
  const [p, setP] = useState<Product>(
    product ?? {
      id: crypto.randomUUID(),
      name: "",
      sku: "",
      category: "Coffee Beans",
      unit: "kg",
      minimum: 15,
      reorder: 25,
      cost: 0,
      active: true,
      inventoryTracked: true,
    },
  );
  const [openingQuantity, setOpeningQuantity] = useState(0);
  const update = (key: string, value: string | number) =>
    setP({ ...p, [key]: value });
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (execute({ type: "product", product: p, openingQuantity: product ? undefined : openingQuantity })) onClose();
      }}
    >
      <div className="form-body">
        <div className="form-grid">
          <label>
            Product name *
            <input
              required
              value={p.name}
              onChange={(e) => update("name", e.target.value)}
            />
          </label>
          <label>
            SKU *
            <input
              required
              value={p.sku}
              onChange={(e) => update("sku", e.target.value)}
            />
          </label>
          <label>
            Category
            <select
              value={p.category}
              onChange={(e) => update("category", e.target.value)}
            >
              {[
                "Coffee Beans",
                "Milk & Dairy",
                "Syrups",
                "Powders",
                "Cups & Lids",
                "Packaging",
                "Ingredients",
                "Cleaning Supplies",
                "Other Supplies",
              ].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label>
            Unit
            <select
              value={p.unit}
              onChange={(e) => update("unit", e.target.value)}
            >
              {["kg", "L", "bottles", "pcs", "packs"].map((u) => (
                <option key={u}>{u}</option>
              ))}
            </select>
          </label>
          <label>
            Minimum stock
            <input
              type="number"
              min="0"
              required
              value={p.minimum}
              onChange={(e) => update("minimum", Number(e.target.value))}
            />
          </label>
          <label>
            Reorder level
            <input
              type="number"
              min={p.minimum}
              required
              value={p.reorder}
              onChange={(e) => update("reorder", Number(e.target.value))}
            />
          </label>
          <label>
            Unit value (₱)
            <input
              type="number"
              min="0"
              step=".01"
              value={p.cost}
              onChange={(e) => update("cost", Number(e.target.value))}
            />
          </label>
        </div>
        {!product && <label className="form-full">Initial Head Office Quantity ({p.unit})
          <input type="number" min="0" step="any" required value={openingQuantity}
            onChange={e => setOpeningQuantity(Number(e.target.value))}/>
        </label>}
        <label className="checkbox-label form-full"><input type="checkbox" checked={p.inventoryTracked !== false}
          onChange={e => setP({...p, inventoryTracked: e.target.checked})}/>
          Track inventory when sold or consumed
        </label>
        <p className="field-help">
          Opening quantities are added to Head Office with a Stock Received
          movement. Branches start at zero until a transfer is received.
        </p>
      </div>
      <div className="modal-footer">
        <button type="button" className="button secondary" onClick={onClose}>
          Cancel
        </button>
        <button className="button primary">Save product</button>
      </div>
    </form>
  );
}
