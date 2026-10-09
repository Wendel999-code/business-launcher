"use client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { useApp } from "@/components/providers";
import { branches } from "@/data/dummy/branches";
import { Panel } from "@/components/ui";
import { canAccessLocation } from "@/lib/permissions";
import { money } from "@/lib/utils";
export function WastageInsights() {
  const { store, profile } = useApp();
  const waste = store.movements.filter(
    (m) => m.type === "Wastage" && canAccessLocation(profile, m.locationId),
  );
  const value = (productId: string, quantity: number) =>
    Math.abs(quantity) *
    (store.products.find((p) => p.id === productId)?.cost ?? 0);
  const branchData = branches
    .filter((b) => canAccessLocation(profile, b.id))
    .map((b) => ({
      branch: b.name,
      value: waste
        .filter((m) => m.locationId === b.id)
        .reduce((a, m) => a + value(m.productId, m.quantity), 0),
    }));
  const ranking = store.products
    .map((p) => ({
      name: p.name,
      quantity: waste
        .filter((m) => m.productId === p.id)
        .reduce((a, m) => a + Math.abs(m.quantity), 0),
      unit: p.unit,
      value: waste
        .filter((m) => m.productId === p.id)
        .reduce((a, m) => a + value(m.productId, m.quantity), 0),
    }))
    .filter((p) => p.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 4);
  return (
    <div className="report-charts">
      <Panel
        title="Wastage by branch"
        subtitle="Estimated value of wasted inventory."
      >
        <div style={{ height: 210, padding: "5px 20px" }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={branchData}>
              <CartesianGrid
                vertical={false}
                strokeDasharray="3 4"
                stroke="#eee8df"
              />
              <XAxis
                dataKey="branch"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10 }}
                tickFormatter={(v) => `₱${v}`}
              />
              <Tooltip formatter={(v) => money(Number(v))} />
              <Bar
                dataKey="value"
                name="Wastage value"
                fill="#b89570"
                radius={[5, 5, 0, 0]}
                maxBarSize={50}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>
      <Panel title="Most wasted products" subtitle="Ranked by inventory value.">
        <div className="payment-legend">
          {ranking.map((p, i) => (
            <div key={p.name}>
              <span>
                <strong className="muted">0{i + 1}</strong> {p.name}
              </span>
              <strong>
                {money(p.value)}
                <small className="cell-subtitle">
                  {p.quantity} {p.unit}
                </small>
              </strong>
            </div>
          ))}
          {!ranking.length && (
            <p className="field-help">No wastage recorded yet.</p>
          )}
        </div>
      </Panel>
    </div>
  );
}
