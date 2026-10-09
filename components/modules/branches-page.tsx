"use client";
import Link from "next/link";
import {
  Store,
  MapPin,
  UserRound,
  Phone,
  ArrowUpRight,
  Package,
} from "lucide-react";
import { branches } from "@/data/dummy/branches";
import { useApp } from "@/components/providers";
import { Badge, Panel } from "@/components/ui";
import { money, TODAY } from "@/lib/utils";
import { Dashboard } from "@/components/dashboard/dashboard";
import { useState } from "react";
export function BranchesPage() {
  const { store } = useApp();
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">BREW COFFEE · MANAGEMENT</div>
          <h1>
            Our branches<span className="title-dot">.</span>
          </h1>
          <p>Three neighborhoods. The same love for a good cup of coffee.</p>
        </div>
        <Badge>3 Active Branches</Badge>
      </div>
      <div className="branch-cards">
        {branches.map((b, i) => {
          const sales = store.sales.filter(
            (s) => s.branchId === b.id && s.status === "Submitted",
          );
          const low = store.inventory.filter(
            (x) =>
              x.locationId === b.id &&
              x.quantity <
                (store.products.find((p) => p.id === x.productId)?.minimum ??
                  0),
          ).length;
          return (
            <section className="panel branch-card" key={b.id}>
              <div className={`branch-card-banner banner-${i}`}>
                <span>BREW COFFEE</span>
                <Store size={68} strokeWidth={0.75} />
                <span>{b.code}</span>
              </div>
              <div className="branch-card-body">
                <div className="branch-card-title">
                  <h2>{b.name} Branch</h2>
                  <Badge>Active</Badge>
                </div>
                <p>
                  <MapPin size={15} />
                  {b.address}
                </p>
                <p>
                  <UserRound size={15} />
                  {b.manager}
                </p>
                <p>
                  <Phone size={15} />
                  {b.phone}
                </p>
                <div className="branch-card-stats">
                  <div>
                    <small>Today's sales</small>
                    <strong>
                      {money(
                        sales
                          .filter((s) => s.date === TODAY)
                          .reduce((a, s) => a + s.gross - s.discounts, 0),
                      )}
                    </strong>
                  </div>
                  <div>
                    <small>This month</small>
                    <strong>
                      {money(
                        sales
                          .filter((s) => s.date.startsWith("2026-10"))
                          .reduce((a, s) => a + s.gross - s.discounts, 0),
                      )}
                    </strong>
                  </div>
                </div>
                <div className="branch-health">
                  <Package size={16} />
                  <span>{low} items need replenishment</span>
                  <Badge>{low ? "Low Stock" : "Healthy"}</Badge>
                </div>
                <Link
                  className="button secondary full"
                  href={`/branches/${b.id}`}
                >
                  Explore branch <ArrowUpRight size={16} />
                </Link>
              </div>
            </section>
          );
        })}
      </div>
      <div className="info-box">
        <Store size={20} />
        <span>
          Head Office has visibility across all locations. Branch employees see
          only their assigned branch.
        </span>
      </div>
    </>
  );
}
export function BranchDetails({ id }: { id: string }) {
  const { profile } = useApp();
  const [tab, setTab] = useState("Overview");
  const b = branches.find((b) => b.id === id);
  if (!b || (profile.role !== "admin" && profile.branchId !== id))
    return (
      <div className="empty-state">
        <h1>Branch unavailable</h1>
        <p>You do not have access to this branch.</p>
      </div>
    );
  // Branch details use the same scoped operations, with a dedicated branch view below.
  return (
    <>
      <Link className="text-link back-link" href="/branches">
        ← All branches
      </Link>
      <div className="branch-detail-tabs">
        {[
          "Overview",
          "Sales",
          "Inventory",
          "Stock Transfers",
          "Adjustments",
          "Wastage",
          "Activity",
        ].map((t) => (
          <button
            key={t}
            className={tab === t ? "selected" : ""}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === "Overview" ? (
        <Dashboard branchId={id} />
      ) : (
        <BranchTab id={id} tab={tab} />
      )}
    </>
  );
}
function BranchTab({ id, tab }: { id: string; tab: string }) {
  const { store } = useApp();
  const b = branches.find((b) => b.id === id)!;
  const rows =
    tab === "Sales"
      ? store.sales
          .filter((s) => s.branchId === id)
          .map((s) => ({
            reference: s.id,
            date: s.date,
            description: money(s.gross - s.discounts),
            status: s.status,
          }))
      : tab === "Inventory"
        ? store.inventory
            .filter((x) => x.locationId === id)
            .map((x) => ({
              reference: store.products.find((p) => p.id === x.productId)!.sku,
              date: x.updatedAt,
              description: `${store.products.find((p) => p.id === x.productId)!.name} · ${x.quantity} ${store.products.find((p) => p.id === x.productId)!.unit}`,
              status:
                x.quantity <
                store.products.find((p) => p.id === x.productId)!.minimum
                  ? "Low Stock"
                  : "In Stock",
            }))
        : tab === "Stock Transfers"
          ? store.transfers
              .filter((t) => t.branchId === id)
              .map((t) => ({
                reference: t.id,
                date: t.date,
                description: `${t.items.length} products from Head Office`,
                status: t.status,
              }))
          : tab === "Activity"
            ? store.activity
                .filter((a) => a.branchId === id)
                .map((a) => ({
                  reference: a.reference,
                  date: a.date.slice(0, 10),
                  description: a.action,
                  status: a.module,
                }))
            : store.movements
                .filter(
                  (m) =>
                    m.locationId === id &&
                    (tab === "Wastage"
                      ? m.type === "Wastage"
                      : !m.type.startsWith("Transfer") && m.type !== "Wastage"),
                )
                .map((m) => ({
                  reference: m.reference,
                  date: m.date.slice(0, 10),
                  description: `${store.products.find((p) => p.id === m.productId)!.name} · ${m.quantity} · ${m.remarks}`,
                  status: m.type,
                }));
  return (
    <Panel
      title={`${b.name} · ${tab}`}
      subtitle="Operational records for this branch"
    >
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>REFERENCE</th>
              <th>DATE</th>
              <th>DETAILS</th>
              <th>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 20).map((r, i) => (
              <tr key={i}>
                <td>{r.reference}</td>
                <td>{r.date}</td>
                <td>{r.description}</td>
                <td>
                  <Badge>{r.status}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!rows.length && (
        <div className="empty-state">
          <Package size={25} />
          <p>No records for this branch yet.</p>
        </div>
      )}
    </Panel>
  );
}
