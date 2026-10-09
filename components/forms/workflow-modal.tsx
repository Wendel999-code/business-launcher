"use client";
import { Info, ArrowRight } from "lucide-react";
import { Modal } from "@/components/ui";
import { Transfer, Sale, Product } from "@/types";
import { TransferForm } from "./transfer-form";
import { SaleForm } from "./sale-form";
import { AdjustmentForm } from "./adjustment-form";
import { ProductForm } from "./product-form";
import { ReceiveForm } from "./receive-form";
export function WorkflowModal({
  type,
  onClose,
  transfer,
  sale,
  product,
}: {
  type: string;
  onClose: () => void;
  transfer?: Transfer;
  sale?: Sale;
  product?: Product;
}) {
  const titles: Record<string, string> = {
    transfer: "New stock transfer",
    sale: "Record daily sales",
    adjustment: "Record stock adjustment",
    wastage: "Record wastage",
    count: "Physical inventory count",
    product: product ? "Edit product" : "Add a product",
    receive: "Confirm stock received",
    detail: "Transfer details",
    help: "Welcome to your daily workspace",
  };
  return (
    <Modal
      title={titles[type] ?? type}
      subtitle={
        type === "transfer"
          ? "Keep your branches supplied, one delivery at a time."
          : type === "receive"
            ? "Compare the delivery with the dispatched quantities."
            : "Brew Coffee · Sales & Inventory"
      }
      onClose={onClose}
    >
      {type === "transfer" ? (
        <TransferForm transfer={transfer} onClose={onClose} />
      ) : type === "sale" ? (
        <SaleForm sale={sale} onClose={onClose} />
      ) : ["adjustment", "wastage", "count"].includes(type) ? (
        <AdjustmentForm type={type} onClose={onClose} />
      ) : type === "product" ? (
        <ProductForm product={product} onClose={onClose} />
      ) : transfer ? (
        <ReceiveForm
          transfer={transfer}
          readOnly={type === "detail"}
          onClose={onClose}
        />
      ) : (
        <div className="help-content">
          <div className="info-box">
            <Info size={18} />
            <span>
              This is a working demo. Changes are saved in this browser. Switch
              accounts from your profile menu to explore the branch experience.
            </span>
          </div>
          <h3>Your daily workflow</h3>
          <ol>
            <li>Head Office creates a stock transfer.</li>
            <li>Dispatch the transfer to deduct Head Office stock.</li>
            <li>Switch to the destination branch account.</li>
            <li>Confirm received quantities to update branch inventory.</li>
            <li>Record daily sales, wastage and stock adjustments.</li>
            <li>Review reports and the audit trail from Head Office.</li>
          </ol>
          <button className="button primary" onClick={onClose}>
            Ready to brew <ArrowRight size={16} />
          </button>
        </div>
      )}
    </Modal>
  );
}
