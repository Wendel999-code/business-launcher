"use client";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { useApp } from "@/components/providers";
import { Badge } from "@/components/ui";
import { Transfer } from "@/types";
import { locationName } from "@/data/dummy/branches";
export function ReceiveForm({
  transfer,
  onClose,
  readOnly,
}: {
  transfer: Transfer;
  onClose: () => void;
  readOnly: boolean;
}) {
  const { store, execute } = useApp();
  const [quantities, setQuantities] = useState(
    transfer.items.map((x) => x.received ?? x.quantity),
  );
  const [remarks, setRemarks] = useState("");
  const discrepancy = quantities.some(
    (q, i) => q !== transfer.items[i].quantity,
  );
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (
          execute({
            type: "transition",
            id: transfer.id,
            status: "Received",
            quantities,
            remarks,
          })
        )
          onClose();
      }}
    >
      <div className="form-body">
        <div className="transfer-detail">
          <div>
            <small>Transfer reference</small>
            <strong>{transfer.id}</strong>
          </div>
          <Badge>{transfer.status}</Badge>
        </div>
        <div className="transfer-route">
          <span>Head Office</span>
          <ArrowRight size={20} />
          <strong>{locationName(transfer.branchId)}</strong>
        </div>
        <p className="field-help">{transfer.notes}</p>
        <div className="table-scroll">
          <table className="receiving-table">
            <thead>
              <tr>
                <th>PRODUCT</th>
                <th>EXPECTED</th>
                <th>RECEIVED</th>
                <th>DIFFERENCE</th>
              </tr>
            </thead>
            <tbody>
              {transfer.items.map((item, i) => {
                const p = store.products.find((p) => p.id === item.productId)!;
                return (
                  <tr key={item.productId}>
                    <td>
                      <strong>{p.name}</strong>
                      <small className="cell-subtitle">{p.sku}</small>
                    </td>
                    <td>
                      {item.quantity} {p.unit}
                    </td>
                    <td>
                      {readOnly ? (
                        `${item.received ?? "—"} ${item.received !== undefined ? p.unit : ""}`
                      ) : (
                        <input
                          aria-label={`${p.name} received quantity`}
                          type="number"
                          step="any"
                          min="0"
                          max={item.quantity}
                          value={quantities[i]}
                          onChange={(e) =>
                            setQuantities(
                              quantities.map((q, j) =>
                                j === i ? Number(e.target.value) : q,
                              ),
                            )
                          }
                        />
                      )}
                    </td>
                    <td
                      className={
                        quantities[i] !== item.quantity ? "danger-text" : ""
                      }
                    >
                      {readOnly && item.received === undefined
                        ? "—"
                        : quantities[i] - item.quantity}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!readOnly && (
          <label className="form-full">
            Receiving remarks {discrepancy ? "*" : ""}
            <textarea
              required={discrepancy}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Note shortages or delivery issues..."
            />
          </label>
        )}
        {transfer.receivedBy && (
          <p className="field-help">
            Received by {transfer.receivedBy} on {transfer.receivedAt}
          </p>
        )}
      </div>
      <div className="modal-footer">
        <button type="button" className="button secondary" onClick={onClose}>
          {readOnly ? "Close" : "Cancel"}
        </button>
        {!readOnly && (
          <button className="button primary">Confirm receipt</button>
        )}
      </div>
    </form>
  );
}
