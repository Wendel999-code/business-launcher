"use client";
import { useState } from "react";
import { Info, ArrowRight } from "lucide-react";
import { useApp } from "@/components/providers";
import { Badge } from "@/components/ui";
import { BranchSelect } from "./branch-select";
export function AdjustmentForm({
  type,
  onClose,
}: {
  type: string;
  onClose: () => void;
}) {
  const { store, profile, execute } = useApp();
  const [location, setLocation] = useState(
    profile.role === "admin" ? "hq" : profile.branchId,
  );
  const [productId, setProduct] = useState("p1");
  const [quantity, setQuantity] = useState(0);
  const [reason, setReason] = useState(
    type === "wastage" ? "Spillage" : "Damaged",
  );
  const [remarks, setRemarks] = useState("");
  const current =
    store.inventory.find(
      (x) => x.locationId === location && x.productId === productId,
    )?.quantity ?? 0;
  const p = store.products.find((p) => p.id === productId)!;
  const delta =
    type === "count"
      ? quantity - current
      : type === "wastage"
        ? -Math.abs(quantity)
        : quantity;
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (
          execute(
            type === "count"
              ? {
                  type: "count",
                  productId,
                  locationId: location,
                  physicalQuantity: quantity,
                  remarks,
                }
              : {
                  type: "adjust",
                  productId,
                  locationId: location,
                  quantity: delta,
                  reason: type === "wastage" ? "Wastage" : reason,
                  remarks:
                    type === "wastage" ? `${reason} — ${remarks}` : remarks,
                },
          )
        )
          onClose();
      }}
    >
      <div className="form-body">
        <div className="info-box">
          <Info size={18} />
          <span>
            Every inventory change creates a movement and audit record. Remarks
            are required.
          </span>
        </div>
        <div className="form-grid">
          <label>
            Location
            <BranchSelect includeHQ value={location} onChange={setLocation} />
          </label>
          <label>
            Product
            <select
              value={productId}
              onChange={(e) => setProduct(e.target.value)}
            >
              {store.products
                .filter((p) => p.active)
                .map((p) => (
                  <option value={p.id} key={p.id}>
                    {p.name}
                  </option>
                ))}
            </select>
          </label>
          <label>
            {type === "count"
              ? "Physical quantity"
              : type === "wastage"
                ? "Wasted quantity"
                : "Adjustment (+ / −)"}{" "}
            ({p.unit})
            <input
              type="number"
              step="any"
              required
              min={type === "adjustment" ? -current : 0}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
            />
          </label>
          {type !== "count" && (
            <label>
              Reason
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              >
                {(type === "wastage"
                  ? [
                      "Spillage",
                      "Expired",
                      "Preparation Error",
                      "Damaged Packaging",
                      "Quality Issue",
                      "Other",
                    ]
                  : [
                      "Damaged",
                      "Wastage",
                      "Spillage",
                      "Missing",
                      "Stock Count Correction",
                      "Other",
                    ]
                ).map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </label>
          )}
        </div>
        <div className="quantity-preview">
          <div>
            <small>System quantity</small>
            <strong>
              {current} {p.unit}
            </strong>
          </div>
          <ArrowRight size={18} />
          <div>
            <small>
              {type === "count" ? "Physical quantity" : "New stock"}
            </small>
            <strong>
              {current + delta} {p.unit}
            </strong>
          </div>
          <Badge>{`${delta > 0 ? "+" : ""}${delta} ${p.unit}`}</Badge>
        </div>
        <label className="form-full">
          Remarks {type === "count" && delta === 0 ? "" : "*"}
          <textarea
            required={type !== "count" || delta !== 0}
            minLength={type === "count" && delta === 0 ? 0 : 3}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Explain the reason for this stock change..."
          />
        </label>
      </div>
      <div className="modal-footer">
        <button type="button" className="button secondary" onClick={onClose}>
          Cancel
        </button>
        <button className="button primary">
          {type === "count"
            ? "Confirm stock count"
            : type === "wastage"
              ? "Record wastage"
              : "Save adjustment"}
        </button>
      </div>
    </form>
  );
}
