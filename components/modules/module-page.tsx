"use client";
import { useState } from "react";
import {
  Plus,
  Package,
  Truck,
  CircleDollarSign,
  TriangleAlert,
  History,
  ClipboardCheck,
} from "lucide-react";
import { useApp } from "@/components/providers";
import { Stat, Modal } from "@/components/ui";
import { DataTable, Row } from "@/components/shared/data-table";
import { WorkflowModal } from "@/components/forms/workflow-modal";
import { branches, locationName } from "@/data/dummy/branches";
import { canAccess } from "@/lib/permissions";
import { money } from "@/lib/utils";
import { Transfer, Sale, Product } from "@/types";
import { createModuleTable } from "./module-table";
import { BranchesPage } from "./branches-page";
import { WastageInsights } from "./wastage-insights";
import { ReportsPage } from "./reports-page";
import { NotificationsPage, SettingsPage, UsersPage } from "./system-pages";
const labels: Record<string, [string, string, string?, string?]> = {
  sales: [
    "Daily sales",
    "Every cup counts. Keep your daily numbers in one place.",
    "Record daily sales",
    "sale",
  ],
  inventory: [
    "Inventory",
    "The right supplies, in the right place, at the right time.",
    "Record adjustment",
    "adjustment",
  ],
  transfers: [
    "Stock transfers",
    "From Head Office to your branches. Track every delivery.",
    "New transfer",
    "transfer",
  ],
  adjustments: [
    "Stock adjustments",
    "A clear record of every change to your inventory.",
    "New adjustment",
    "adjustment",
  ],
  wastage: [
    "Wastage tracking",
    "Track what goes to waste. Find opportunities to do better.",
    "Record wastage",
    "wastage",
  ],
  products: [
    "Product catalog",
    "Everything that goes into your daily brew.",
    "Add product",
    "product",
  ],
  movements: [
    "Inventory movements",
    "Follow every item, from allocation to your coffee counter.",
  ],
  activity: [
    "Activity logs",
    "Who changed what, when, and where. A complete audit trail.",
  ],
};
export function ModulePage({ module }: { module: string }) {
  const { store, profile, execute } = useApp();
  const [selectedLocation, setLocation] = useState(
    profile.role === "admin" ? "hq" : profile.branchId,
  );
  const [branch, setBranch] = useState("all");
  const [status, setStatus] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [modal, setModal] = useState<string | null>(null);
  const [selectedTransfer, setSelectedTransfer] = useState<Transfer>();
  const [selectedSale, setSelectedSale] = useState<Sale>();
  const [selectedProduct, setSelectedProduct] = useState<Product>();
  const [confirm, setConfirm] = useState<{
    id: string;
    status: Transfer["status"];
  } | null>(null);
  const [detail, setDetail] = useState<Row | null>(null);
  if (!canAccess(profile, module))
    return (
      <div className="empty-state">
        <Package size={35} />
        <h1>Head Office access required</h1>
        <p>Your account can only access your assigned branch operations.</p>
      </div>
    );
  if (module === "branches") return <BranchesPage />;
  if (
    ["sales-reports", "inventory-reports", "branch-performance"].includes(
      module,
    )
  )
    return <ReportsPage module={module} />;
  if (module === "notifications") return <NotificationsPage />;
  if (module === "settings") return <SettingsPage />;
  if (module === "users") return <UsersPage />;
  const location =
    profile.role === "admin" ? selectedLocation : profile.branchId;
  const [title, subtitle, action, type] = labels[module] ?? [
    "Workspace",
    "Your daily business operations.",
  ];
  const { rows, columns, rowActions } = createModuleTable({
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
  });
  const sum = (key: string) =>
    rows.reduce((a, r) => a + Number(r[key] ?? 0), 0);
  const statuses =
    module === "inventory"
      ? ["In Stock", "Low Stock", "Critical", "Out of Stock"]
      : module === "transfers"
        ? [
            "Draft",
            "Pending",
            "Dispatched",
            "In Transit",
            "Received",
            "Cancelled",
          ]
        : module === "products"
          ? ["Active", "Inactive"]
          : module === "sales"
            ? ["Submitted", "Draft"]
            : [];
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            BREW COFFEE ·{" "}
            {module === "products"
              ? "MANAGEMENT"
              : module === "activity"
                ? "SYSTEM"
                : "OPERATIONS"}
          </div>
          <h1>
            {title}
            <span className="title-dot">.</span>
          </h1>
          <p>{subtitle}</p>
        </div>
        <div className="heading-actions">
          {module === "inventory" && (
            <>
              <button
                className="button secondary"
                onClick={() => window.location.assign("/movements")}
              >
                <History size={15} />
                Movement history
              </button>
              <button
                className="button secondary"
                onClick={() => setModal("count")}
              >
                <ClipboardCheck size={15} />
                Stock count
              </button>
            </>
          )}
          {action && !(module === "transfers" && profile.role !== "admin") && (
            <button
              className="button primary"
              onClick={() => {
                setSelectedProduct(undefined);
                setSelectedSale(undefined);
                setSelectedTransfer(undefined);
                setModal(type!);
              }}
            >
              <Plus size={16} />
              {action}
            </button>
          )}
        </div>
      </div>
      <div className="stats-grid module-stats">
        <Stat
          label={
            module === "sales"
              ? "Net sales"
              : module === "wastage"
                ? "Wastage value"
                : "Total records"
          }
          value={
            module === "sales"
              ? money(sum("net"))
              : module === "wastage"
                ? money(sum("value"))
                : String(rows.length)
          }
          caption="in the current view"
          icon={
            module === "sales" ? (
              <CircleDollarSign size={19} />
            ) : (
              <Package size={19} />
            )
          }
        />
        <Stat
          label={
            module === "sales"
              ? "Transactions"
              : module === "inventory"
                ? "Inventory value"
                : "Locations"
          }
          value={
            module === "sales"
              ? String(sum("transactions"))
              : module === "inventory"
                ? money(
                    rows.reduce(
                      (a, r) =>
                        a +
                        Number(r.quantity) *
                          (store.products.find((p) => p.id === r.id)?.cost ??
                            0),
                      0,
                    ),
                  )
                : String(new Set(rows.map((r) => r.branch)).size)
          }
          caption={
            module === "inventory"
              ? locationName(location)
              : "across selected records"
          }
          icon={<Truck size={19} />}
        />
        <Stat
          label={
            module === "inventory"
              ? "Low stock items"
              : module === "transfers"
                ? "Awaiting receipt"
                : "Traceable records"
          }
          value={
            module === "inventory"
              ? String(rows.filter((r) => r.status !== "In Stock").length)
              : module === "transfers"
                ? String(
                    rows.filter((r) =>
                      ["Dispatched", "In Transit"].includes(String(r.status)),
                    ).length,
                  )
                : String(rows.length)
          }
          caption={
            module === "inventory"
              ? "replenishment recommended"
              : "with full history"
          }
          icon={<TriangleAlert size={19} />}
          warning={module === "inventory"}
        />
      </div>
      {module === "wastage" && <WastageInsights />}
      <DataTable
        key={module}
        title={title}
        rows={rows}
        columns={columns}
        actions={rowActions}
        filters={
          <>
            {module === "inventory" ? (
              <select
                aria-label="Inventory location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              >
                {profile.role === "admin" ? (
                  <>
                    <option value="hq">Head Office</option>
                    {branches.map((b) => (
                      <option value={b.id} key={b.id}>
                        {b.name} Branch
                      </option>
                    ))}
                  </>
                ) : (
                  <option value={profile.branchId}>
                    {locationName(profile.branchId)}
                  </option>
                )}
              </select>
            ) : (
              profile.role === "admin" &&
              module !== "products" && (
                <select
                  aria-label="Filter location"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                >
                  <option value="all">All locations</option>
                  {["activity", "adjustments", "movements", "wastage"].includes(
                    module,
                  ) && <option value="hq">Head Office</option>}
                  {branches.map((b) => (
                    <option value={b.id} key={b.id}>
                      {b.name} Branch
                    </option>
                  ))}
                </select>
              )
            )}
            {statuses.length > 0 && (
              <select
                aria-label="Filter status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="all">All statuses</option>
                {statuses.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            )}
            {module !== "inventory" && module !== "products" && (
              <div className="table-date-range">
                <input
                  aria-label="From date"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
                <span>–</span>
                <input
                  aria-label="To date"
                  type="date"
                  min={dateFrom}
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
            )}
          </>
        }
      />
      {modal && modal !== "toggle-product" && (
        <WorkflowModal
          type={modal}
          onClose={() => setModal(null)}
          transfer={selectedTransfer}
          sale={selectedSale}
          product={selectedProduct}
        />
      )}
      {modal === "toggle-product" && selectedProduct && (
        <Modal
          title={`${selectedProduct.active ? "Deactivate" : "Activate"} product?`}
          onClose={() => setModal(null)}
        >
          <div className="form-body">
            <p>
              {selectedProduct.name} will be{" "}
              {selectedProduct.active
                ? "excluded from new transfers. Its inventory and history will be preserved."
                : "available for new transfers and inventory operations."}
            </p>
          </div>
          <div className="modal-footer">
            <button className="button secondary" onClick={() => setModal(null)}>
              Cancel
            </button>
            <button
              className="button primary"
              onClick={() => {
                if (
                  execute({
                    type: "product",
                    product: {
                      ...selectedProduct,
                      active: !selectedProduct.active,
                    },
                  })
                )
                  setModal(null);
              }}
            >
              Confirm
            </button>
          </div>
        </Modal>
      )}
      {confirm && (
        <Modal
          title={`${confirm.status === "Cancelled" ? "Cancel" : confirm.status === "Dispatched" ? "Dispatch" : "Update"} transfer?`}
          onClose={() => setConfirm(null)}
        >
          <div className="form-body">
            <p>{confirm.id}</p>
            <div className="info-box">
              <Truck size={20} />
              <span>
                {confirm.status === "Dispatched"
                  ? "The quantities will be deducted from Head Office inventory and recorded as Transfer Out movements."
                  : confirm.status === "Cancelled"
                    ? "The transfer will be cancelled. Its history will remain available."
                    : `This transfer will move to ${confirm.status}.`}
              </span>
            </div>
          </div>
          <div className="modal-footer">
            <button
              className="button secondary"
              onClick={() => setConfirm(null)}
            >
              Go back
            </button>
            <button
              className="button primary"
              onClick={() => {
                if (execute({ type: "transition", ...confirm }))
                  setConfirm(null);
              }}
            >
              Confirm {confirm.status.toLowerCase()}
            </button>
          </div>
        </Modal>
      )}
      {detail && (
        <Modal
          title="Daily sales report"
          subtitle={String(detail.branch)}
          onClose={() => setDetail(null)}
        >
          <div className="form-body">
            <div className="detail-grid">
              {Object.entries(detail)
                .filter(([k]) => k !== "id")
                .map(([k, v]) => (
                  <div key={k}>
                    <small>{k}</small>
                    <strong>
                      {[
                        "gross",
                        "discounts",
                        "net",
                        "cash",
                        "wallet",
                        "card",
                      ].includes(k)
                        ? money(Number(v))
                        : String(v)}
                    </strong>
                  </div>
                ))}
            </div>
          </div>
          <div className="modal-footer">
            <button
              className="button secondary"
              onClick={() => setDetail(null)}
            >
              Close
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
