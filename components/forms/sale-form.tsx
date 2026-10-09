"use client";
import { useState } from "react";
import { useApp } from "@/components/providers";
import { Sale, SaleItem } from "@/types";
import { money, TODAY } from "@/lib/utils";
import { BranchSelect } from "./branch-select";
import { SaleItems } from "./sale-items";
import { branches } from "@/data/dummy/branches";
export function SaleForm({
  onClose,
  sale,
}: {
  onClose: () => void;
  sale?: Sale;
}) {
  const { profile, execute } = useApp();
  const [branch, setBranch] = useState(
    sale?.branchId ??
      (profile.role === "admin" ? branches[0].id : profile.branchId),
  );
  const [date, setDate] = useState(sale?.date ?? TODAY);
  const [gross, setGross] = useState(sale?.gross ?? 0);
  const [discount, setDiscount] = useState(sale?.discounts ?? 0);
  const [transactions, setTransactions] = useState(sale?.transactions ?? 0);
  const [cash, setCash] = useState(sale?.cash ?? 0);
  const [wallet, setWallet] = useState(sale?.wallet ?? 0);
  const [card, setCard] = useState(sale?.card ?? 0);
  const [error, setError] = useState("");
  const [items, setItems] = useState<SaleItem[]>(sale?.items ?? []);
  const net = gross - discount;
  const save = (draft: boolean) => {
    if (
      execute({
        type: "sale",
        sale: {
          id: sale?.id ?? `S-${crypto.randomUUID().slice(0, 8)}`,
          branchId: branch,
          date,
          gross,
          discounts: discount,
          transactions,
          cash,
          wallet,
          card,
          user: profile.name,
          status: draft ? "Draft" : "Submitted",
          items,
        },
      })
    )
      onClose();
    else
      setError("Review your amounts, payment breakdown, and reporting date.");
  };
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save(false);
      }}
    >
      <div className="form-body">
        <div className="form-grid">
          <label>
            Branch
            {sale?.status === "Submitted" ? <input disabled value={branches.find(b => b.id === branch)?.name ?? branch}/> : <BranchSelect value={branch} onChange={setBranch} />}
          </label>
          <label>
            Reporting date
            <input
              type="date"
              required
              max={TODAY}
              disabled={sale?.status === "Submitted"}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>
          <label>
            Gross sales (₱)
            <input
              type="number"
              min="0"
              step="0.01"
              required
              value={gross}
              onChange={(e) => setGross(Number(e.target.value))}
            />
          </label>
          <label>
            Discounts (₱)
            <input
              type="number"
              min="0"
              max={gross}
              step="0.01"
              value={discount}
              onChange={(e) => setDiscount(Number(e.target.value))}
            />
          </label>
          <label>
            Transactions
            <input
              type="number"
              min="0"
              step="1"
              required
              value={transactions}
              onChange={(e) => setTransactions(Number(e.target.value))}
            />
          </label>
          <div className="calculated-value">
            <span>Net sales</span>
            <strong>{money(net, 2)}</strong>
          </div>
        </div>
        <SaleItems items={items} onChange={setItems} branchId={branch} previous={sale}/>
        <h3 className="form-section-title">Payment breakdown</h3>
        <div className="form-grid three">
          {[
            ["Cash", cash, setCash],
            ["GCash / E-Wallet", wallet, setWallet],
            ["Card", card, setCard],
          ].map(([label, value, setter]) => (
            <label key={String(label)}>
              {String(label)} (₱)
              <input
                type="number"
                min="0"
                step="0.01"
                value={Number(value)}
                onChange={(e) =>
                  (setter as (n: number) => void)(Number(e.target.value))
                }
              />
            </label>
          ))}
        </div>
        <div
          className={`payment-total ${Math.abs(net - cash - wallet - card) > 0.01 ? "unbalanced" : ""}`}
        >
          <span>Payment total: {money(cash + wallet + card, 2)}</span>
          <strong>Difference: {money(net - cash - wallet - card, 2)}</strong>
        </div>
        <p className="field-help">
          One submitted report per branch per day. Existing submitted reports
          are kept in your sales history.
        </p>
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
          {sale?.status !== "Submitted" && <button type="button" className="button secondary" onClick={() => save(true)}>Save draft</button>}
          <button className="button primary">Submit daily sales</button>
        </div>
      </div>
    </form>
  );
}
