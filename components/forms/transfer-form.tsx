"use client";
import { useState } from "react";
import { Plus, Trash2, Package, ArrowRight } from "lucide-react";
import { useApp } from "@/components/providers";
import { Transfer } from "@/types";
import { TODAY } from "@/lib/utils";
import { BranchSelect } from "./branch-select";
import { branches } from "@/data/dummy/branches";
export function TransferForm({
  onClose,
  transfer: existing,
}: {
  onClose: () => void;
  transfer?: Transfer;
}) {
  const { store, profile, execute } = useApp();
  const [branch, setBranch] = useState(existing?.branchId ?? branches[0].id);
  const [items, setItems] = useState(
    existing?.items ?? [{ productId: store.products.find(p => p.active)?.id ?? "", quantity: 20 }],
  );
  const [date, setDate] = useState(existing?.date ?? TODAY);
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [error, setError] = useState("");
  const save = (draft: boolean) => {
    const transfer: Transfer = {
      id:
        existing?.id ??
        `TR-2026-${String(Math.max(108, ...store.transfers.map((t) => Number(t.id.split("-").at(-1)) || 0)) + 1).padStart(4, "0")}`,
      branchId: branch,
      date,
      status: draft ? "Draft" : "Pending",
      items,
      notes,
      user: profile.name,
    };
    if (execute({ type: "transfer", transfer })) onClose();
    else setError("Check the selected products and available quantities.");
  };
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save(false);
      }}
    >
      <div className="form-body">
        <div className="info-box">
          <Package size={17} />
          <span>
            Stock is deducted from Head Office when dispatched. The branch
            confirms receipt before its stock increases.
          </span>
        </div>
        <div className="form-grid">
          <label>
            From location
            <input value="Head Office Inventory" disabled />
          </label>
          <label>
            Destination branch
            <BranchSelect value={branch} onChange={setBranch} />
          </label>
          <label>
            Transfer date
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>
          <label>
            Prepared by
            <input disabled value={profile.name} />
          </label>
        </div>
        <div className="form-section-label">
          <h3>Transfer items</h3>
          <span>Product · quantity · unit</span>
        </div>
        {items.map((item, i) => {
          const p = store.products.find((p) => p.id === item.productId);
          const qty =
            store.inventory.find(
              (x) => x.productId === item.productId && x.locationId === "hq",
            )?.quantity ?? 0;
          return (
            <div key={i} className="transfer-form-row">
              <label className="grow">
                Product
                <select
                  value={item.productId}
                  onChange={(e) =>
                    setItems(
                      items.map((x, j) =>
                        j === i ? { ...x, productId: e.target.value } : x,
                      ),
                    )
                  }
                >
                  <option value="" disabled>Select a product</option>
                  {store.products
                    .filter((p) => p.active)
                    .map((p) => (
                      <option value={p.id} key={p.id}>
                        {p.name}
                      </option>
                    ))}
                </select>
                <small>
                  {qty} {p?.unit} available
                </small>
              </label>
              <label>
                Quantity
                <input
                  type="number"
                  required
                  min="0.01"
                  max={qty}
                  step="any"
                  value={item.quantity}
                  onChange={(e) =>
                    setItems(
                      items.map((x, j) =>
                        j === i
                          ? { ...x, quantity: Number(e.target.value) }
                          : x,
                      ),
                    )
                  }
                />
                <small>{p?.unit}</small>
              </label>
              <button
                type="button"
                className="icon-button"
                disabled={items.length === 1}
                aria-label="Remove transfer item"
                onClick={() => setItems(items.filter((_, j) => j !== i))}
              >
                <Trash2 size={16} />
              </button>
            </div>
          );
        })}
        <button
          type="button"
          className="button secondary small"
          onClick={() =>
            setItems([
              ...items,
              {
                productId:
                  store.products.find(
                    (p) => p.active && !items.some((i) => i.productId === p.id),
                  )?.id ?? "",
                quantity: 1,
              },
            ])
          }
        >
          <Plus size={14} /> Add another product
        </button>
        <label className="form-full">
          Delivery notes
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Instructions for this delivery..."
          />
        </label>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
      </div>
      <div className="modal-footer">
        <button type="button" className="button secondary" onClick={onClose}>
          Cancel
        </button>
        <div>
          <button
            type="button"
            className="button secondary"
            onClick={() => save(true)}
          >
            Save draft
          </button>
          <button className="button primary">
            Create transfer <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </form>
  );
}
