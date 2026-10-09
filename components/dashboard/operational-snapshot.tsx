"use client";
import { useApp } from "@/components/providers";
import { DataTable } from "@/components/shared/data-table";
import { Badge, Stat } from "@/components/ui";
import { Package, Truck, SlidersHorizontal } from "lucide-react";
import { locationName } from "@/data/dummy/branches";
import { canAccessLocation } from "@/lib/permissions";
import { stockStatus } from "@/lib/utils";

export function OperationalSnapshot({ scope }: { scope: string }) {
  const { store, profile } = useApp();
  const visible = (id: string) =>
    canAccessLocation(profile, id) && (scope === "all" || scope === id);
  const inventory = store.inventory.filter((i) => visible(i.locationId));
  const transfers = store.transfers.filter((t) => visible(t.branchId));
  const adjustments = store.movements.filter(
    (m) =>
      visible(m.locationId) &&
      ![
        "Transfer In",
        "Transfer Out",
        "Stock Received",
        "Sale",
        "Consumption",
        "Sales Correction",
      ].includes(m.type),
  );
  const rows = inventory.map((i) => {
    const p = store.products.find((p) => p.id === i.productId)!;
    return {
      id: `${i.locationId}-${i.productId}`,
      location: locationName(i.locationId),
      product: p.name,
      sku: p.sku,
      quantity: i.quantity,
      unit: p.unit,
      status: stockStatus(i.quantity, p.minimum),
    };
  });
  return (
    <section className="operational-snapshot">
      <div className="stats-grid module-stats">
        <Stat
          label="Inventory products"
          value={String(new Set(inventory.map((i) => i.productId)).size)}
          caption={`${inventory.length} location stock records`}
          icon={<Package size={18} />}
        />
        <Stat
          label="Stock transfers"
          value={String(transfers.length)}
          caption={`${transfers.filter((t) => t.status === "Received").length} received · ${transfers.filter((t) => ["Pending", "Dispatched", "In Transit"].includes(t.status)).length} pending`}
          icon={<Truck size={18} />}
        />
        <Stat
          label="Inventory adjustments"
          value={String(adjustments.length)}
          caption="from recorded stock movements"
          icon={<SlidersHorizontal size={18} />}
        />
      </div>
      <div className="report-table-title">
        <h2>Live inventory by location</h2>
        <p>Head Office and branch balances from your saved operations.</p>
      </div>
      <DataTable
        title="Stored inventory"
        rows={rows}
        columns={[
          { key: "location", label: "LOCATION" },
          { key: "product", label: "PRODUCT" },
          { key: "sku", label: "SKU" },
          {
            key: "quantity",
            label: "AVAILABLE",
            render: (r) => (
              <strong>
                {String(r.quantity)} {String(r.unit)}
              </strong>
            ),
          },
          {
            key: "status",
            label: "STATUS",
            render: (r) => <Badge>{String(r.status)}</Badge>,
          },
        ]}
      />
    </section>
  );
}
