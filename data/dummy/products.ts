import { Product, Inventory } from "@/types";
const rows: [string, string, string, string, number, number, number][] = [
  ["Arabica Coffee Beans", "BEAN-001", "Coffee Beans", "kg", 15, 25, 680],
  ["Robusta Coffee Beans", "BEAN-002", "Coffee Beans", "kg", 10, 20, 420],
  ["Whole Milk", "MLK-001", "Milk & Dairy", "L", 15, 20, 95],
  ["Oat Milk", "MLK-002", "Milk & Dairy", "L", 10, 15, 145],
  ["Vanilla Syrup", "SYR-001", "Syrups", "bottles", 5, 10, 320],
  ["Caramel Syrup", "SYR-002", "Syrups", "bottles", 5, 10, 340],
  ["Chocolate Syrup", "SYR-003", "Syrups", "bottles", 5, 10, 310],
  ["12oz Paper Cups", "CUP-012", "Cups & Lids", "pcs", 100, 200, 4],
  ["16oz Paper Cups", "CUP-016", "Cups & Lids", "pcs", 100, 200, 5],
  ["Cup Lids", "LID-001", "Cups & Lids", "pcs", 100, 200, 2],
  ["Paper Straws", "PKG-001", "Packaging", "pcs", 100, 200, 1],
  ["Napkins", "PKG-002", "Packaging", "pcs", 200, 400, 0.5],
  ["White Sugar", "ING-001", "Ingredients", "kg", 5, 10, 80],
  ["Coffee Filters", "SUP-001", "Other Supplies", "pcs", 50, 100, 3],
  ["Takeaway Bags", "PKG-003", "Packaging", "pcs", 100, 200, 4],
  [
    "Espresso Machine Cleaner",
    "CLN-001",
    "Cleaning Supplies",
    "bottles",
    3,
    5,
    250,
  ],
];
export const products: Product[] = rows.map((r, i) => ({
  id: `p${i + 1}`,
  name: r[0],
  sku: r[1],
  category: r[2],
  unit: r[3],
  minimum: r[4],
  reorder: r[5],
  cost: r[6],
  active: true,
}));
const quantities = {
  hq: [
    240, 180, 160, 85, 48, 36, 40, 4800, 5600, 9200, 6500, 12000, 60, 1000,
    2800, 16,
  ],
  downtown: [42, 28, 5, 24, 8, 12, 7, 680, 420, 960, 500, 800, 15, 180, 300, 6],
  riverside: [12, 8, 12, 8, 3, 4, 4, 320, 260, 80, 380, 140, 12, 120, 340, 5],
  uptown: [36, 22, 32, 18, 9, 3, 12, 560, 740, 1200, 800, 900, 4, 40, 90, 2],
};
export const inventory: Inventory[] = Object.entries(quantities).flatMap(
  ([locationId, qs]) =>
    qs.map((quantity, i) => ({
      productId: products[i].id,
      locationId,
      quantity,
      updatedAt: "2026-10-08",
    })),
);
