"use client";
import { ReactNode, useState } from "react";
import {
  Search,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Download,
  PackageOpen,
} from "lucide-react";
import { exportCsv } from "@/lib/utils";
export interface Column {
  key: string;
  label: string;
  render?: (row: Row) => ReactNode;
}
export type Row = { id: string; [key: string]: unknown };
export function DataTable({
  columns,
  rows,
  title,
  filters,
  actions,
}: {
  columns: Column[];
  rows: Row[];
  title: string;
  filters?: ReactNode;
  actions?: (row: Row) => ReactNode;
}) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [sort, setSort] = useState<{ key: string; asc: boolean } | null>(null);
  const filtered = rows
    .filter((row) =>
      Object.values(row).some((v) =>
        String(v).toLowerCase().includes(search.toLowerCase()),
      ),
    )
    .sort((a, b) => {
      if (!sort) return 0;
      const av = a[sort.key],
        bv = b[sort.key];
      return (
        (typeof av === "number" && typeof bv === "number"
          ? av - bv
          : String(av).localeCompare(String(bv))) * (sort.asc ? 1 : -1)
      );
    });
  const pages = Math.ceil(filtered.length / 8);
  const current = Math.min(page, Math.max(0, pages - 1));
  const visible = filtered.slice(current * 8, current * 8 + 8);
  return (
    <section className="panel data-panel">
      <div className="table-toolbar">
        <div className="table-search">
          <Search size={16} />
          <input
            placeholder={`Search ${title.toLowerCase()}...`}
            aria-label={`Search ${title}`}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
          />
        </div>
        <div className="table-filters">
          {filters}
          <button
            className="button secondary small"
            onClick={() =>
              exportCsv(
                title,
                filtered.map((r) =>
                  Object.fromEntries(columns.map((c) => [c.label, r[c.key]])),
                ),
              )
            }
          >
            <Download size={14} /> Export
          </button>
        </div>
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key}>
                  <button
                    className="sort-button"
                    onClick={() =>
                      setSort({
                        key: c.key,
                        asc: sort?.key === c.key ? !sort.asc : true,
                      })
                    }
                  >
                    {c.label}
                    <ArrowUpDown size={11} />
                  </button>
                </th>
              ))}
              {actions && <th>ACTIONS</th>}
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => (
              <tr key={row.id}>
                {columns.map((c) => (
                  <td key={c.key}>
                    {c.render ? c.render(row) : String(row[c.key] ?? "—")}
                  </td>
                ))}
                {actions && <td className="row-actions">{actions(row)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!visible.length && (
        <div className="empty-state">
          <PackageOpen size={30} />
          <h3>No {title.toLowerCase()} found</h3>
          <p>Try another search or filter, or add your first record.</p>
          <button
            className="text-link"
            onClick={() => {
              setSearch("");
              setPage(0);
            }}
          >
            Clear search
          </button>
        </div>
      )}
      <div className="pagination">
        <span>
          Showing {filtered.length ? current * 8 + 1 : 0}–
          {Math.min((current + 1) * 8, filtered.length)} of {filtered.length}{" "}
          records
        </span>
        <div>
          <button
            aria-label="Previous page"
            disabled={current === 0}
            onClick={() => setPage(current - 1)}
          >
            <ChevronLeft size={15} />
          </button>
          {Array.from({ length: Math.min(pages, 5) }, (_, i) => {
            const n =
              pages > 5 && current > 2
                ? Math.min(current - 2, pages - 5) + i
                : i;
            return (
              <button
                key={n}
                className={n === current ? "selected" : ""}
                onClick={() => setPage(n)}
              >
                {n + 1}
              </button>
            );
          })}
          <button
            aria-label="Next page"
            disabled={current >= pages - 1}
            onClick={() => setPage(current + 1)}
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>
    </section>
  );
}
