"use client";
import { useState } from "react";
import {
  Download,
  CircleDollarSign,
  CreditCard,
  Package,
  ChartNoAxesCombined,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { useApp } from "@/components/providers";
import { branches, locationName } from "@/data/dummy/branches";
import { Panel, Stat, Badge } from "@/components/ui";
import { SalesChart } from "@/components/dashboard/sales-chart";
import { DataTable, Row } from "@/components/shared/data-table";
import { exportCsv, money, TODAY, stockStatus } from "@/lib/utils";
export function ReportsPage({ module }: { module: string }) {
  const { store } = useApp();
  const [branch, setBranch] = useState("all");
  const [period, setPeriod] = useState("month");
  const [inventoryView, setInventoryView] = useState("Current inventory");
  const inventory = module === "inventory-reports";
  const sales = store.sales.filter(
    (s) =>
      s.status === "Submitted" &&
      (branch === "all" || branch === s.branchId) &&
      (period === "day"
        ? s.date === TODAY
        : period === "week"
          ? s.date >= "2026-10-02"
          : s.date.startsWith("2026-10")),
  );
  const total = sales.reduce((a, s) => a + s.gross - s.discounts, 0);
  const payments = [
    {
      name: "Cash",
      value: sales.reduce((a, s) => a + s.cash, 0),
      color: "#654332",
    },
    {
      name: "GCash / E-Wallet",
      value: sales.reduce((a, s) => a + s.wallet, 0),
      color: "#b68a60",
    },
    {
      name: "Card",
      value: sales.reduce((a, s) => a + s.card, 0),
      color: "#dac5a9",
    },
  ];
  const data = branches
    .filter((b) => branch === "all" || branch === b.id)
    .map((b) => ({
      id: b.id,
      branch: b.name,
      sales: sales
        .filter((s) => s.branchId === b.id)
        .reduce((a, s) => a + s.gross - s.discounts, 0),
      transactions: sales
        .filter((s) => s.branchId === b.id)
        .reduce((a, s) => a + s.transactions, 0),
      lowStock: store.inventory.filter(
        (x) =>
          x.locationId === b.id &&
          x.quantity <
            (store.products.find((p) => p.id === x.productId)?.minimum ?? 0),
      ).length,
      wastage: store.movements
        .filter((m) => m.locationId === b.id && m.type === "Wastage")
        .reduce(
          (a, m) =>
            a +
            Math.abs(m.quantity) *
              (store.products.find((p) => p.id === m.productId)?.cost ?? 0),
          0,
        ),
      adjustments: store.movements.filter(
        (m) => m.locationId === b.id && !m.type.startsWith("Transfer"),
      ).length,
    }));
  const stocks = store.inventory.filter(
    (x) => branch === "all" || x.locationId === branch,
  );
  const invValue = stocks.reduce(
    (a, x) =>
      a +
      x.quantity *
        (store.products.find((p) => p.id === x.productId)?.cost ?? 0),
    0,
  );
  const low = stocks.filter(
    (x) =>
      x.quantity <
      (store.products.find((p) => p.id === x.productId)?.minimum ?? 0),
  );
  const title = inventory
    ? "Inventory reports"
    : module === "branch-performance"
      ? "Branch performance"
      : "Sales reports";
  let reportRows: Row[] = inventory
    ? stocks.map((x) => {
        const p = store.products.find((p) => p.id === x.productId)!;
        return {
          id: x.locationId + x.productId,
          product: p.name,
          branch: locationName(x.locationId),
          quantity: x.quantity,
          unit: p.unit,
          value: x.quantity * p.cost,
          status: stockStatus(x.quantity, p.minimum),
        };
      })
    : data;

  let inventoryColumns = [
    { key: "product", label: "PRODUCT" },
    { key: "branch", label: "LOCATION" },
    { key: "quantity", label: "STOCK" },
    { key: "unit", label: "UNIT" },
    {
      key: "value",
      label: "VALUE",
      render: (r: Row) => money(Number(r.value)),
    },
    {
      key: "status",
      label: "STATUS",
      render: (r: Row) => <Badge>{String(r.status)}</Badge>,
    },
  ];
  if (inventory) {
    if (inventoryView === "Low stock")
      reportRows = reportRows.filter((r) => r.status !== "In Stock");
    if (["Movements", "Adjustments", "Wastage"].includes(inventoryView)) {
      reportRows = store.movements
        .filter(
          (m) =>
            (branch === "all" || m.locationId === branch) &&
            (inventoryView === "Movements" ||
              (inventoryView === "Wastage" && m.type === "Wastage") ||
              (inventoryView === "Adjustments" &&
                !m.type.startsWith("Transfer") &&
                m.type !== "Wastage")),
        )
        .map((m) => ({
          id: m.id,
          product: store.products.find((p) => p.id === m.productId)?.name,
          branch: locationName(m.locationId),
          quantity: m.quantity,
          type: m.type,
          reference: m.reference,
          remarks: m.remarks,
          date: m.date.slice(0, 10),
        }));
      inventoryColumns = [
        { key: "product", label: "PRODUCT" },
        { key: "branch", label: "LOCATION" },
        { key: "quantity", label: "QUANTITY" },
        { key: "type", label: "TYPE" },
        { key: "reference", label: "REFERENCE" },
        { key: "remarks", label: "REMARKS" },
        { key: "date", label: "DATE" },
      ];
    } else if (inventoryView === "Transfers") {
      reportRows = store.transfers
        .filter((t) => branch === "all" || t.branchId === branch)
        .map((t) => ({
          id: t.id,
          branch: locationName(t.branchId),
          date: t.date,
          items: t.items.length,
          status: t.status,
          received: t.receivedBy ?? "Awaiting receipt",
        }));
      inventoryColumns = [
        { key: "id", label: "REFERENCE" },
        { key: "branch", label: "DESTINATION" },
        { key: "date", label: "DATE" },
        { key: "items", label: "ITEMS" },
        {
          key: "status",
          label: "STATUS",
          render: (r: Row) => <Badge>{String(r.status)}</Badge>,
        },
        { key: "received", label: "RECEIVED BY" },
      ];
    } else if (inventoryView === "Physical counts") {
      reportRows = store.counts
        .filter((c) => branch === "all" || c.locationId === branch)
        .map((c) => ({
          id: c.id,
          product: store.products.find((p) => p.id === c.productId)?.name,
          branch: locationName(c.locationId),
          system: c.systemQuantity,
          physical: c.physicalQuantity,
          variance: c.variance,
          remarks: c.remarks,
          date: c.date,
        }));
      inventoryColumns = [
        { key: "product", label: "PRODUCT" },
        { key: "branch", label: "LOCATION" },
        { key: "system", label: "SYSTEM QTY" },
        { key: "physical", label: "PHYSICAL QTY" },
        { key: "variance", label: "VARIANCE" },
        { key: "remarks", label: "REMARKS" },
        { key: "date", label: "DATE" },
      ];
    }
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">BREW COFFEE · ANALYTICS</div>
          <h1>
            {title}
            <span className="title-dot">.</span>
          </h1>
          <p>Clear numbers. Better decisions. A stronger business.</p>
        </div>
        <button
          className="button primary"
          onClick={() => exportCsv(module, reportRows)}
        >
          <Download size={16} /> Export report
        </button>
      </div>
      <div className="report-toolbar">
        <div className="segmented-control">
          {[
            ["day", "Daily"],
            ["week", "Weekly"],
            ["month", "Monthly"],
          ].map(([v, l]) => (
            <button
              key={v}
              className={period === v ? "selected" : ""}
              onClick={() => setPeriod(v)}
            >
              {l}
            </button>
          ))}
        </div>
        <select
          aria-label="Report branch"
          value={branch}
          onChange={(e) => setBranch(e.target.value)}
        >
          <option value="all">All branches</option>
          {branches.map((b) => (
            <option value={b.id} key={b.id}>
              {b.name}
            </option>
          ))}
        </select>
        <span className="muted">
          {inventory
            ? "Current stock snapshot"
            : "Period ending October 8, 2026"}
        </span>
      </div>
      <div className="stats-grid module-stats">
        <Stat
          label={inventory ? "Inventory value" : "Net sales"}
          value={money(inventory ? invValue : total)}
          caption="across selected locations"
          icon={<CircleDollarSign size={18} />}
        />
        <Stat
          label={inventory ? "Inventory records" : "Transactions"}
          value={String(
            inventory
              ? stocks.length
              : sales.reduce((a, s) => a + s.transactions, 0),
          )}
          caption="in the current report"
          icon={<ChartNoAxesCombined size={18} />}
        />
        <Stat
          label={inventory ? "Low stock items" : "Average transaction"}
          value={
            inventory
              ? String(low.length)
              : money(
                  total / (sales.reduce((a, s) => a + s.transactions, 0) || 1),
                )
          }
          caption={inventory ? "need replenishment" : "per customer visit"}
          icon={<Package size={18} />}
          warning={inventory}
        />
      </div>
      {!inventory && module === "sales-reports" ? (
        <div className="report-charts">
          <SalesChart branchId={branch === "all" ? undefined : branch} />
          <Panel title="Payment breakdown" subtitle="How your customers pay.">
            <div className="donut-chart">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={payments}
                    dataKey="value"
                    innerRadius={58}
                    outerRadius={80}
                    paddingAngle={4}
                    stroke="none"
                  >
                    {payments.map((p) => (
                      <Cell key={p.name} fill={p.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => money(Number(v))} />
                </PieChart>
              </ResponsiveContainer>
              <span>
                <CreditCard size={20} />
                <strong>Payments</strong>
              </span>
            </div>
            <div className="payment-legend">
              {payments.map((p) => (
                <div key={p.name}>
                  <span>
                    <i style={{ background: p.color }} />
                    {p.name}
                  </span>
                  <strong>{money(p.value)}</strong>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      ) : (
        <Panel
          title={inventory ? "Stock health by branch" : "Sales by branch"}
          subtitle={
            inventory
              ? "Items below their minimum stock level."
              : "Net sales for the selected reporting period."
          }
        >
          <div style={{ height: 260, padding: "16px 24px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid vertical={false} strokeDasharray="3 4" />
                <XAxis
                  dataKey="branch"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) =>
                    inventory ? String(v) : `₱${v / 1000}k`
                  }
                />
                <Tooltip
                  formatter={(v) =>
                    inventory ? `${v} items` : money(Number(v))
                  }
                />
                <Bar
                  name={inventory ? "Low stock items" : "Net sales"}
                  dataKey={inventory ? "lowStock" : "sales"}
                  fill="#79513a"
                  radius={[5, 5, 0, 0]}
                  maxBarSize={70}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      )}
      <div className="report-table-title">
        <h2>{inventory ? inventoryView : "Branch comparison"}</h2>
        <p>
          {inventory
            ? "All locations, products and stock values."
            : "Performance, inventory health and operational efficiency."}
        </p>
      </div>
      {inventory && (
        <div className="inventory-report-tabs segmented-control">
          {[
            "Current inventory",
            "Low stock",
            "Movements",
            "Transfers",
            "Adjustments",
            "Wastage",
            "Physical counts",
          ].map((v) => (
            <button
              key={v}
              className={inventoryView === v ? "selected" : ""}
              onClick={() => setInventoryView(v)}
            >
              {v}
            </button>
          ))}
        </div>
      )}
      <DataTable
        key={inventoryView}
        title={title}
        rows={reportRows}
        columns={
          inventory
            ? inventoryColumns
            : [
                { key: "branch", label: "BRANCH" },
                {
                  key: "sales",
                  label: "NET SALES",
                  render: (r) => <strong>{money(Number(r.sales))}</strong>,
                },
                { key: "transactions", label: "TRANSACTIONS" },
                { key: "lowStock", label: "LOW STOCK ITEMS" },
                {
                  key: "wastage",
                  label: "WASTAGE VALUE",
                  render: (r) => money(Number(r.wastage)),
                },
                { key: "adjustments", label: "ADJUSTMENTS" },
              ]
        }
      />
    </>
  );
}
