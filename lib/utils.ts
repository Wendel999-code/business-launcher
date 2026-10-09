export const TODAY = "2026-10-08";
export const money = (n: number, decimals = 0) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: decimals,
  }).format(n);
export const number = (n: number) => new Intl.NumberFormat("en-PH").format(n);
export const dateLabel = (date: string) =>
  new Date(`${date.slice(0, 10)}T12:00:00+08:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "Asia/Manila",
  });
export const stockStatus = (quantity: number, minimum: number) =>
  quantity <= 0
    ? "Out of Stock"
    : quantity <= minimum * 0.4
      ? "Critical"
      : quantity < minimum
        ? "Low Stock"
        : "In Stock";
export function exportCsv(name: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return;
  const keys = Object.keys(rows[0]);
  const quote = (v: unknown) =>
    `"${String(v ?? "")
      .replace(/^[=+@-]/, "'$&")
      .replaceAll('"', '""')}"`;
  const text = [
    keys.map(quote).join(","),
    ...rows.map((row) => keys.map((k) => quote(row[k])).join(",")),
  ].join("\r\n");
  const url = URL.createObjectURL(
    new Blob(["\ufeff" + text], { type: "text/csv;charset=utf-8;" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = `brew-${name}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
