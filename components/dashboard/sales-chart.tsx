"use client";
import { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp } from "lucide-react";
import { useApp } from "@/components/providers";
import { branches } from "@/data/dummy/branches";
import { Panel } from "@/components/ui";
import { money, TODAY } from "@/lib/utils";
export function SalesChart({ branchId }: { branchId?: string }) {
  const { store, profile } = useApp();
  const [range, setRange] = useState("Last 7 days");
  const [filter, setFilter] = useState("all");
  const branch =
    profile.role !== "admin" ? profile.branchId : (branchId ?? filter);
  const count =
    range === "Today"
      ? 1
      : range === "Last 7 days"
        ? 7
        : range === "Last 30 days"
          ? 30
          : range === "This month"
            ? 8
            : 365;
  const dates = [
    ...new Set(
      store.sales
        .filter(
          (s) =>
            s.status === "Submitted" &&
            s.date <= TODAY &&
            (range !== "This month" || s.date.startsWith("2026-10")),
        )
        .map((s) => s.date),
    ),
  ]
    .sort()
    .slice(-count);
  const data = dates.map((date) => ({
    date:
      range === "Today"
        ? "Today"
        : new Date(date + "T12:00:00").toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
    ...Object.fromEntries(
      branches.map((b) => [
        b.id,
        store.sales
          .filter(
            (s) =>
              s.date === date &&
              s.branchId === b.id &&
              s.status === "Submitted",
          )
          .reduce((a, s) => a + s.gross - s.discounts, 0),
      ]),
    ),
  }));
  const total = store.sales
    .filter(
      (s) =>
        dates.includes(s.date) &&
        s.status === "Submitted" &&
        (branch === "all" || s.branchId === branch),
    )
    .reduce((a, s) => a + s.gross - s.discounts, 0);
  return (
    <Panel
      title="Sales overview"
      subtitle="A little insight into how your business is brewing."
      className="sales-panel"
      action={
        <select
          aria-label="Sales chart date range"
          value={range}
          onChange={(e) => setRange(e.target.value)}
        >
          {[
            "Today",
            "Last 7 days",
            "Last 30 days",
            "This month",
            "This year",
          ].map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>
      }
    >
      <div className="chart-summary">
        <div>
          <strong>{money(total)}</strong>
          <span>
            Total net sales{" "}
            <span className="chart-period">/ {range.toLowerCase()}</span>
          </span>
        </div>
        {profile.role === "admin" && !branchId && (
          <label className="chart-branch">
            <select
              aria-label="Sales chart branch"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All branches</option>
              {branches.map((b) => (
                <option value={b.id} key={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      <div className="chart-container">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 12, right: 8, left: -15, bottom: 0 }}
          >
            <defs>
              {branches.map((b) => (
                <linearGradient
                  id={`fill-${b.id}`}
                  key={b.id}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor={b.color} stopOpacity={0.18} />
                  <stop offset="100%" stopColor={b.color} stopOpacity={0.01} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid
              strokeDasharray="3 4"
              vertical={false}
              stroke="#eee9e3"
            />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: "#928982" }}
              dy={9}
              minTickGap={25}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: "#928982" }}
              tickFormatter={(v) => `₱${v / 1000}k`}
              domain={[0, "auto"]}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 10,
                borderColor: "#e7e0d8",
                fontSize: 12,
              }}
              formatter={(v) => money(Number(v))}
            />
            {branches
              .filter((b) => branch === "all" || b.id === branch)
              .map((b) => (
                <Area
                  key={b.id}
                  type="monotone"
                  dataKey={b.id}
                  name={`${b.name} Branch`}
                  stroke={b.color}
                  strokeWidth={2.3}
                  fill={`url(#fill-${b.id})`}
                  activeDot={{ r: 5, strokeWidth: 3, stroke: "#fff" }}
                />
              ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="chart-legend">
        {branches
          .filter((b) => branch === "all" || b.id === branch)
          .map((b) => (
            <span key={b.id}>
              <i style={{ background: b.color }} />
              {b.name} Branch
            </span>
          ))}
        <span className="chart-insight">
          <TrendingUp size={13} /> Steady growth, one cup at a time
        </span>
      </div>
    </Panel>
  );
}
