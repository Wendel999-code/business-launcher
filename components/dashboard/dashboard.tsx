"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  Download,
  Plus,
  CircleDollarSign,
  ChartNoAxesCombined,
  Store,
  TriangleAlert,
  ArrowRight,
  Truck,
  ClipboardList,
  Package,
  ArrowUpRight,
  Coffee,
  ChevronRight,
  Check,
  Activity,
} from "lucide-react";
import { useApp } from "@/components/providers";
import { branches, locationName } from "@/data/dummy/branches";
import { Stat, Panel, Badge, ViewLink } from "@/components/ui";
import { SalesChart } from "./sales-chart";
import { WorkflowModal } from "@/components/forms/workflow-modal";
import { money, number, stockStatus, TODAY, exportCsv } from "@/lib/utils";
import { canAccessLocation } from "@/lib/permissions";
import { OperationalSnapshot } from "./operational-snapshot";
export function Dashboard({ branchId }: { branchId?: string }) {
  const { store, profile } = useApp();
  const router = useRouter();
  const [modal, setModal] = useState<string | null>(null);
  const [branchFilter, setBranchFilter] = useState(branchId ?? "all");
  const [date, setDate] = useState(TODAY);
  const isAdmin = profile.role === "admin" && !branchId;
  const scope =
    profile.role !== "admin" ? profile.branchId : (branchId ?? branchFilter);
  const scopedSales = store.sales.filter(
    (s) =>
      s.status === "Submitted" && (scope === "all" || s.branchId === scope),
  );
  const todaySales = scopedSales.filter((s) => s.date === date);
  const today = todaySales.reduce((a, s) => a + s.gross - s.discounts, 0);
  const monthly = scopedSales
    .filter((s) => s.date.startsWith(date.slice(0, 7)))
    .reduce((a, s) => a + s.gross - s.discounts, 0);
  const lowStock = store.inventory.filter(
    (x) =>
      canAccessLocation(profile, x.locationId) &&
      (scope === "all" || x.locationId === scope) &&
      store.products.find(p => p.id === x.productId)?.active &&
      stockStatus(x.quantity, store.products.find(p => p.id === x.productId)?.minimum ?? 0) !== "In Stock",
  );
  const pending = store.transfers.filter(
    (t) =>
      ["Pending", "Dispatched", "In Transit"].includes(t.status) &&
      (scope === "all" || t.branchId === scope),
  );
  const todaysTransactions = todaySales.reduce((a, s) => a + s.transactions, 0);
  const yesterday = new Date(date + "T12:00:00Z");
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const prev = scopedSales
    .filter((s) => s.date === yesterday.toISOString().slice(0, 10))
    .reduce((a, s) => a + s.gross - s.discounts, 0);
  const growth = prev
    ? `${(((today - prev) / prev) * 100).toFixed(1)}%`
    : undefined;
  const activity = store.activity.filter(
    (a) =>
      canAccessLocation(profile, a.branchId) &&
      (scope === "all" || a.branchId === scope),
  );
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <span className="sun-icon">☀</span> YOUR DAILY BREW, AT A GLANCE
          </div>
          <h1>
            {branchId
              ? `${locationName(branchId)}`
              : profile.role === "admin"
                ? "Business overview"
                : `${locationName(profile.branchId)} overview`}
            <span className="title-dot">.</span>
          </h1>
          <p>
            {isAdmin
              ? "Good morning, Alex. Here’s what’s happening across your branches."
              : "Everything you need to keep your branch brewing smoothly."}
          </p>
        </div>
        <div className="heading-actions">
          <button
            className="button secondary"
            onClick={() =>
              exportCsv(
                "overview",
                todaySales.map((s) => ({
                  date: s.date,
                  branch: locationName(s.branchId),
                  net_sales: s.gross - s.discounts,
                  transactions: s.transactions,
                })),
              )
            }
          >
            <Download size={15} /> Export report
          </button>
        

          {
            !isAdmin && (
  <button
            className="button primary"
            onClick={() => setModal(isAdmin ? "transfer" : "sale")}
          >
            <Plus size={17} />
            Record sales
          </button>
            )
          }
        </div>
      </div>
      <div className="dashboard-filter">
        <div className="filter-group">
          <span className="filter-label">Overview</span>
          <span className="filter-separator" />
          {isAdmin ? (
            <label className="filter-select">
              <Store size={15} />
              <select
                aria-label="Dashboard branch"
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
              >
                <option value="all">All branches</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} Branch
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <span className="filter-label">{locationName(scope)}</span>
          )}
          <span className="filter-separator" />
          <label className="date-filter">
            <CalendarDays size={15} />
            <input
              aria-label="Dashboard date"
              type="date"
              value={date}
              max={TODAY}
              onChange={(e) => {
                if (e.target.value) setDate(e.target.value);
              }}
            />
          </label>
        </div>
        {/* <div className="live-label">
          <span className="online-dot" /> Last updated just now
        </div> */}
      </div>
      <div className="stats-grid">
        <Stat
          label="Today's sales"
          value={money(today)}
          change={growth}
          caption="vs. yesterday"
          icon={<CircleDollarSign size={19} />}
          spark
        />
        <Stat
          label="This month's sales"
          value={money(monthly)}
          caption={`Month to date · ${new Date(date + 'T12:00:00+08:00').toLocaleDateString('en-US', {month:'long', timeZone:'Asia/Manila'})}`}
          icon={<ChartNoAxesCombined size={19} />}
          spark
        />
        <Stat
          label={isAdmin ? "Active branches" : "Today's transactions"}
          value={
            isAdmin
              ? String(scope === "all" ? branches.length : 1)
              : number(todaysTransactions)
          }
          change={isAdmin ? "All operating" : undefined}
          caption={isAdmin ? "" : "completed transactions"}
          icon={<Store size={19} />}
        />
        {/* <Stat
          label="Low stock items"
          value={String(lowStock.length)}
          change="Needs attention"
          caption={scope === "all" ? "across all locations" : "at this branch"}
          icon={<TriangleAlert size={19} />}
          warning
        /> */}
      </div>
      {/* <OperationalSnapshot scope={scope}/> */}
      <div className="dashboard-middle">
        <SalesChart branchId={scope === "all" ? undefined : scope} />
        {/* <div className="right-panels">
          <section className="quick-actions">
            <div className="quick-title">
              <span className="quick-coffee">
                <Coffee size={20} />
              </span>
              <span>Keep things brewing</span>
            </div>
            <h2>A smoother day starts here.</h2>
            <p>Your everyday essentials, just a click away.</p>
            <button onClick={() => setModal(isAdmin ? "transfer" : "sale")}>
              <span>
                <Truck size={17} />
                {isAdmin ? "Create stock transfer" : "Record daily sales"}
              </span>
              <ArrowUpRight size={16} />
            </button>
            <button onClick={() => router.push("/inventory")}>
              <span>
                <Package size={17} />
                View inventory
              </span>
              <ArrowUpRight size={16} />
            </button>
            <button onClick={() => setModal("adjustment")}>
              <span>
                <ClipboardList size={17} />
                Record an adjustment
              </span>
              <ArrowUpRight size={16} />
            </button>
          </section>
          <section className="transfer-summary">
            <div className="transfer-summary-icon">
              <Truck size={22} />
            </div>
            <div>
              <span>Pending transfers</span>
              <strong>
                {pending.length}
                <small> waiting to be completed</small>
              </strong>
            </div>
            <button
              aria-label="View pending transfers"
              onClick={() => router.push("/transfers")}
            >
              <ArrowRight size={18} />
            </button>
          </section>
        </div> */}
      </div>
      <div className="dashboard-bottom">
        <Panel
          title={isAdmin ? "Branch performance" : "Daily sales summary"}
          subtitle={
            isAdmin
              ? ""
              : `Recent sales for ${locationName(scope)}.`
          }
          action={
            <ViewLink
              onClick={() => router.push(isAdmin ? "/branches" : "/sales")}
            >
              View {isAdmin ? "branches" : "sales"}
            </ViewLink>
          }
          className="branch-panel"
        >
          <div className="table-scroll">
            <table className="branch-table">
              <thead>
                <tr>
                  <th>{isAdmin ? "BRANCH" : "DATE"}</th>
                  <th>NET SALES</th>
                  {/* <th>TRANSACTIONS</th> */}
                  <th>{isAdmin ? "INVENTORY" : "STATUS"}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {isAdmin
                  ? branches
                      .filter((b) => scope === "all" || scope === b.id)
                      .map((b, i) => {
                        const s = store.sales.filter(
                          (s) =>
                            s.branchId === b.id &&
                            s.date === date &&
                            s.status === "Submitted",
                        );
                        const low = lowStock.filter(
                          (x) => x.locationId === b.id,
                        ).length;
                        return (
                          <tr
                            key={b.id}
                            onClick={() => router.push(`/branches/${b.id}`)}
                            className="clickable-row"
                          >
                            <td>
                              <div className="branch-cell">
                                <span className={`branch-avatar branch-${i}`}>
                                  <Store size={18} />
                                </span>
                                <span>
                                  <strong>{b.name} Branch</strong>
                                  <small>
                                    {b.code} · {b.address.split(",").at(-1)}
                                  </small>
                                </span>
                              </div>
                            </td>
                            <td className="strong-cell">
                              {money(
                                s.reduce(
                                  (a, s) => a + s.gross - s.discounts,
                                  0,
                                ),
                              )}
                            </td>
                            {/* <td>
                              {number(
                                s.reduce((a, s) => a + s.transactions, 0),
                              )}
                            </td> */}
                            <td>
                              <Badge>{low > 0 ? "Low Stock" : "Healthy"}</Badge>
                            </td>
                            <td>
                              <ChevronRight size={16} />
                            </td>
                          </tr>
                        );
                      })
                  : scopedSales.slice(0, 3).map((s) => (
                      <tr key={s.id}>
                        <td>{s.date}</td>
                        <td className="strong-cell">
                          {money(s.gross - s.discounts)}
                        </td>
                        <td>{s.transactions}</td>
                        <td>
                          <Badge>{s.status}</Badge>
                        </td>
                        <td />
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
          {/* <div className="table-summary">
            <span>
              <span className="online-dot" />{" "}
              {isAdmin
                ? "All branches are currently active"
                : `Your branch has ${todaysTransactions} transactions today`}
            </span>
            <span>
              {isAdmin
                ? `${number(todaysTransactions)} total transactions today`
                : "Daily reports stay in your sales history"}
            </span>
          </div> */}
        </Panel>
        {/* <Panel
          title="Stock needs attention"
          subtitle="A timely top-up goes a long way."
          action={<span className="count-badge">{lowStock.length} items</span>}
          className="low-stock-panel"
        >
          <div className="low-stock-list">
            {lowStock.slice(0, 3).map((x) => {
              const p = store.products.find((p) => p.id === x.productId)!;
              return (
                <div className="low-stock-row" key={x.productId + x.locationId}>
                  <span
                    className={`product-icon ${p.category === "Milk & Dairy" ? "milk" : ""}`}
                  >
                    <Package size={18} />
                  </span>
                  <div>
                    <strong>{p.name}</strong>
                    <small>{locationName(x.locationId)}</small>
                  </div>
                  <div className="stock-remaining">
                    <strong
                      className={
                        stockStatus(x.quantity, p.minimum) === "Critical"
                          ? "danger-text"
                          : ""
                      }
                    >
                      {x.quantity} <small>{p.unit}</small>
                    </strong>
                    <span>{stockStatus(x.quantity, p.minimum)}</span>
                  </div>
                </div>
              );
            })}
            {!lowStock.length && (
              <div className="empty-inline">
                <Check size={20} /> All stock levels look healthy.
              </div>
            )}
          </div>
          <button
            className="stock-alert-footer"
            onClick={() => router.push("/inventory")}
          >
            <span>View all inventory alerts</span>
            <ArrowRight size={15} />
          </button>
        </Panel> */}
      </div>
      {/* <div className="dashboard-bottom last-row">
        <Panel
          title="Recent stock transfers"
          subtitle="From our head office to your coffee counter."
          action={
            <ViewLink onClick={() => router.push("/transfers")}>
              View all transfers
            </ViewLink>
          }
        >
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>TRANSFER</th>
                  <th>DESTINATION</th>
                  <th>ITEMS</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {store.transfers
                  .filter((t) => scope === "all" || t.branchId === scope)
                  .slice(0, 3)
                  .map((t) => (
                    <tr key={t.id}>
                      <td>
                        <Link className="transfer-id" href="/transfers">
                          {t.id}
                        </Link>
                        <small className="cell-subtitle">{t.date}</small>
                      </td>
                      <td>{locationName(t.branchId)}</td>
                      <td>{t.items.length} products</td>
                      <td>
                        <Badge>{t.status}</Badge>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </Panel>
        <Panel
          title="Recent activity"
          action={
            <ViewLink onClick={() => router.push("/activity")}>
              View all
            </ViewLink>
          }
        >
          <div className="activity-list">
            {activity.slice(0, 3).map((a, i) => (
              <div className="activity-item" key={a.id}>
                <span className={`activity-icon activity-${i}`}>
                  <Activity size={14} />
                </span>
                <div>
                  <p>
                    <strong>{a.user}</strong> {a.action.toLowerCase()}
                  </p>
                  <small>
                    {a.module} <span>·</span>{" "}
                    {new Date(a.date).toLocaleTimeString("en-PH", {
                      hour: "numeric",
                      minute: "2-digit",
                      timeZone: "Asia/Manila",
                    })}
                  </small>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div> */}
      {modal && <WorkflowModal type={modal} onClose={() => setModal(null)} />}
    </>
  );
}
