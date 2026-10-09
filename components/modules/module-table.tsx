"use client";
import { ReactNode } from "react";
import { Package, Eye, Pencil, X } from "lucide-react";
import { Badge } from "@/components/ui";
import { Column, Row } from "@/components/shared/data-table";
import { Store, Profile, Sale, Transfer, Product } from "@/types";
import { locationName } from "@/data/dummy/branches";
import { canAccessLocation } from "@/lib/permissions";
import { money, stockStatus, dateLabel } from "@/lib/utils";
interface TableOptions {
  module: string;
  store: Store;
  profile: Profile;
  location: string;
  branch: string;
  status: string;
  dateFrom: string;
  dateTo: string;
  setDetail: (row: Row) => void;
  setSelectedSale: (sale: Sale | undefined) => void;
  setModal: (modal: string | null) => void;
  setSelectedTransfer: (transfer: Transfer | undefined) => void;
  setSelectedProduct: (product: Product | undefined) => void;
  setConfirm: (
    confirm: { id: string; status: Transfer["status"] } | null,
  ) => void;
}
export function createModuleTable({
  module,
  store,
  profile,
  location,
  branch,
  status,
  dateFrom,
  dateTo,
  setDetail,
  setSelectedSale,
  setModal,
  setSelectedTransfer,
  setConfirm,
  setSelectedProduct,
}: TableOptions) {
  const scoped = (id: string) =>
    canAccessLocation(profile, id) && (branch === "all" || branch === id);
  const inDates = (date: string) =>
    (!dateFrom || date.slice(0, 10) >= dateFrom) &&
    (!dateTo || date.slice(0, 10) <= dateTo);
  let rows: Row[] = [];
  let columns: Column[] = [];
  let rowActions: ((row: Row) => ReactNode) | undefined;
  const badge = (r: Row) => <Badge>{String(r.status)}</Badge>;
  const cash = (key: string) => (r: Row) => (
    <strong>{money(Number(r[key]))}</strong>
  );
  if (module === "inventory") {
    rows = store.inventory
      .filter(
        (x) =>
          x.locationId === location && canAccessLocation(profile, x.locationId),
      )
      .map((x) => {
        const p = store.products.find((p) => p.id === x.productId)!;
        return {
          id: p.id,
          product: p.name,
          sku: p.sku,
          category: p.category,
          quantity: x.quantity,
          unit: p.unit,
          allocated:
            location === "hq"
              ? store.transfers
                  .filter((t) => ["Draft", "Pending"].includes(t.status))
                  .flatMap((t) => t.items)
                  .filter((i) => i.productId === p.id)
                  .reduce((a, i) => a + i.quantity, 0)
              : 0,
          minimum: p.minimum,
          reorder: p.reorder,
          status: stockStatus(x.quantity, p.minimum),
          updated: x.updatedAt,
        };
      })
      .filter((x) => status === "all" || x.status === status);
    columns = [
      {
        key: "product",
        label: "PRODUCT",
        render: (r) => (
          <div className="product-cell">
            <span className="product-icon">
              <Package size={17} />
            </span>
            <span>
              <strong>{String(r.product)}</strong>
              <small>{String(r.sku)}</small>
            </span>
          </div>
        ),
      },
      { key: "category", label: "CATEGORY" },
      {
        key: "quantity",
        label: "AVAILABLE",
        render: (r) => (
          <strong>
            {String(r.quantity)} <span className="muted">{String(r.unit)}</span>
          </strong>
        ),
      },
      ...(location === "hq"
        ? [{ key: "allocated", label: "AWAITING DISPATCH" }]
        : []),
      { key: "minimum", label: "MINIMUM" },
      { key: "reorder", label: "REORDER" },
      { key: "status", label: "STATUS", render: badge },
      { key: "updated", label: "UPDATED" },
    ];
  } else if (module === "sales") {
    rows = store.sales
      .filter(
        (s) =>
          scoped(s.branchId) &&
          inDates(s.date) &&
          (status === "all" || s.status === status),
      )
      .map((s) => ({
        id: s.id,
        date: s.date,
        branch: locationName(s.branchId),
        gross: s.gross,
        discounts: s.discounts,
        net: s.gross - s.discounts,
        transactions: s.transactions,
        user: s.user,
        status: s.status,
        cash: s.cash,
        wallet: s.wallet,
        card: s.card,
        items: s.items?.map(i => { const p = store.products.find(p => p.id === i.productId); return `${p?.name ?? i.productId}: ${i.quantity} ${p?.unit ?? ''} ${i.kind.toLowerCase()}`; }).join(', ') || 'No tracked inventory usage',
      }));
    columns = [
      { key: "date", label: "DATE", render: (r) => dateLabel(String(r.date)) },
      { key: "branch", label: "BRANCH" },
      { key: "gross", label: "GROSS SALES", render: cash("gross") },
      { key: "discounts", label: "DISCOUNTS", render: cash("discounts") },
      { key: "net", label: "NET SALES", render: cash("net") },
      { key: "transactions", label: "TRANSACTIONS" },
      { key: "user", label: "SUBMITTED BY" },
      { key: "status", label: "STATUS", render: badge },
    ];
    rowActions = (r) => (
      <>
        <button
          className="icon-button"
          aria-label="View sales report"
          onClick={() => setDetail(r)}
        >
          <Eye size={15} />
        </button>
        {
          <button
            className="icon-button"
            aria-label="Edit sales report"
            onClick={() => {
              setSelectedSale(store.sales.find((s) => s.id === r.id));
              setModal("sale");
            }}
          >
            <Pencil size={15} />
          </button>
        }
      </>
    );
  } else if (module === "transfers") {
    rows = store.transfers
      .filter(
        (t) =>
          scoped(t.branchId) &&
          inDates(t.date) &&
          (status === "all" || t.status === status),
      )
      .map((t) => ({
        id: t.id,
        date: t.date,
        from: "Head Office",
        branch: locationName(t.branchId),
        items: t.items.length,
        status: t.status,
        user: t.user,
        receivedBy: t.receivedBy ?? "—",
        receivedDate: t.receivedAt ?? "—",
      }));
    columns = [
      {
        key: "id",
        label: "TRANSFER",
        render: (r) => <strong className="transfer-id">{r.id}</strong>,
      },
      { key: "date", label: "DATE" },
      { key: "branch", label: "DESTINATION" },
      { key: "items", label: "ITEMS" },
      { key: "status", label: "STATUS", render: badge },
      { key: "user", label: "PREPARED BY" },
      { key: "receivedBy", label: "RECEIVED BY" },
      { key: "receivedDate", label: "RECEIVED DATE" },
    ];
    rowActions = (r) => (
      <>
        <button
          className="icon-button"
          aria-label="View transfer"
          onClick={() => {
            setSelectedTransfer(store.transfers.find((t) => t.id === r.id));
            setModal("detail");
          }}
        >
          <Eye size={16} />
        </button>
        {profile.role === "admin" && r.status === "Draft" && (
          <button
            className="icon-button"
            aria-label="Edit draft transfer"
            onClick={() => {
              setSelectedTransfer(store.transfers.find((t) => t.id === r.id));
              setModal("transfer");
            }}
          >
            <Pencil size={15} />
          </button>
        )}
        {profile.role === "admin" &&
          ["Draft", "Pending", "Dispatched"].includes(String(r.status)) && (
            <button
              className="button secondary small"
              onClick={() =>
                setConfirm({
                  id: r.id,
                  status:
                    r.status === "Draft"
                      ? "Pending"
                      : r.status === "Pending"
                        ? "Dispatched"
                        : "In Transit",
                })
              }
            >
              {r.status === "Draft"
                ? "Submit"
                : r.status === "Pending"
                  ? "Dispatch"
                  : "In transit"}
            </button>
          )}
        {profile.role === "admin" &&
          ["Draft", "Pending"].includes(String(r.status)) && (
            <button
              className="icon-button"
              aria-label="Cancel transfer"
              onClick={() => setConfirm({ id: r.id, status: "Cancelled" })}
            >
              <X size={15} />
            </button>
          )}
        {profile.role !== "admin" &&
          ["Dispatched", "In Transit"].includes(String(r.status)) && (
            <button
              className="button primary small"
              onClick={() => {
                setSelectedTransfer(store.transfers.find((t) => t.id === r.id));
                setModal("receive");
              }}
            >
              Receive
            </button>
          )}
      </>
    );
  } else if (module === "products") {
    rows = store.products
      .filter(
        (p) =>
          status === "all" || (p.active ? "Active" : "Inactive") === status,
      )
      .map((p) => ({
        id: p.id,
        sku: p.sku,
        product: p.name,
        category: p.category,
        unit: p.unit,
        minimum: p.minimum,
        reorder: p.reorder,
        status: p.active ? "Active" : "Inactive",
        created: "2026-09-01",
      }));
    columns = [
      { key: "sku", label: "SKU" },
      {
        key: "product",
        label: "PRODUCT",
        render: (r) => <strong>{String(r.product)}</strong>,
      },
      { key: "category", label: "CATEGORY" },
      { key: "unit", label: "UNIT" },
      { key: "minimum", label: "MINIMUM STOCK" },
      { key: "reorder", label: "REORDER LEVEL" },
      { key: "status", label: "STATUS", render: badge },
      { key: "created", label: "CREATED" },
    ];
    rowActions = (r) => (
      <>
        <button
          className="icon-button"
          aria-label="Edit product"
          onClick={() => {
            setSelectedProduct(store.products.find((p) => p.id === r.id));
            setModal("product");
          }}
        >
          <Pencil size={16} />
        </button>
        <button
          className="text-link"
          onClick={() => {
            const p = store.products.find((p) => p.id === r.id)!;
            setSelectedProduct(p);
            setModal("toggle-product");
          }}
        >
          {r.status === "Active" ? "Deactivate" : "Activate"}
        </button>
      </>
    );
  } else if (module === "activity") {
    rows = store.activity
      .filter((a) => scoped(a.branchId) && inDates(a.date))
      .map((a) => ({
        id: a.id,
        date: a.date,
        user: a.user,
        role: a.role,
        branch: locationName(a.branchId),
        action: a.action,
        module: a.module,
        reference: a.reference,
      }));
    columns = [
      {
        key: "date",
        label: "TIMESTAMP",
        render: (r) => (
          <span>
            {dateLabel(String(r.date))}
            <small className="cell-subtitle">
              {new Date(String(r.date)).toLocaleTimeString("en-PH", {
                hour: "numeric",
                minute: "2-digit",
                timeZone: "Asia/Manila",
              })}
            </small>
          </span>
        ),
      },
      { key: "user", label: "USER" },
      { key: "role", label: "ROLE" },
      { key: "branch", label: "LOCATION" },
      { key: "action", label: "ACTION" },
      { key: "module", label: "MODULE" },
      { key: "reference", label: "REFERENCE" },
    ];
  } else {
    rows = store.movements
      .filter(
        (m) =>
          scoped(m.locationId) &&
          inDates(m.date) &&
          (module === "movements" ||
            (module === "adjustments" &&
              !m.type.startsWith("Transfer") &&
              m.type !== "Wastage") ||
            (module === "wastage" && m.type === "Wastage")),
      )
      .map((m) => {
        const p = store.products.find((p) => p.id === m.productId)!;
        return {
          id: m.id,
          date: m.date,
          product: p.name,
          sku: p.sku,
          branch: locationName(m.locationId),
          quantity: m.quantity,
          unit: p.unit,
          type: m.type,
          reference: m.reference,
          user: m.user,
          remarks: m.remarks,
          value: Math.abs(m.quantity) * p.cost,
        };
      });
    columns = [
      { key: "date", label: "DATE", render: (r) => dateLabel(String(r.date)) },
      {
        key: "product",
        label: "PRODUCT",
        render: (r) => (
          <span>
            <strong>{String(r.product)}</strong>
            <small className="cell-subtitle">{String(r.sku)}</small>
          </span>
        ),
      },
      { key: "branch", label: "LOCATION" },
      {
        key: "quantity",
        label: module === "wastage" ? "WASTED" : "MOVEMENT",
        render: (r) => (
          <strong
            className={Number(r.quantity) < 0 ? "danger-text" : "positive"}
          >
            {Number(r.quantity) > 0 ? "+" : ""}
            {String(r.quantity)} {String(r.unit)}
          </strong>
        ),
      },
      { key: "type", label: "REASON" },
      { key: "remarks", label: "REMARKS" },
      { key: "user", label: "RECORDED BY" },
      { key: "reference", label: "REFERENCE" },
    ];
  }
  return { rows, columns, rowActions };
}
