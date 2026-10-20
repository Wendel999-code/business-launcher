const LOYVERSE_API_URL = "https://api.loyverse.com/v1.0";

export type CreateLoyverseItem = {
  item_name: string;
  description?: string;
  reference_id?: string;
  category_id?: string | null;
  track_stock?: boolean;
  sold_by_weight?: boolean;
  is_composite?: boolean;
  use_production?: boolean;
  form?: "SQUARE" | "CIRCLE" | "SUN" | "OCTAGON";
  color?:
    | "GREY"
    | "RED"
    | "PINK"
    | "ORANGE"
    | "YELLOW"
    | "GREEN"
    | "BLUE"
    | "PURPLE";
  variants?: {
    sku?: string;
    barcode?: string;
    cost?: number;
    purchase_cost?: number;
    default_pricing_type?: "FIXED" | "VARIABLE";
    default_price?: number | null;
    stores?: {
      store_id: string;
      pricing_type?: "FIXED" | "VARIABLE";
      price?: number;
      available_for_sale?: boolean;
      optimal_stock?: number | null;
      low_stock?: number | null;
    }[];
  }[];
};

export async function createLoyverseItem(item: CreateLoyverseItem) {
  const token = process.env.LOYVERSE_ACCESS_TOKEN;

  if (!token) {
    throw new Error("LOYVERSE_ACCESS_TOKEN is not configured.");
  }

  const response = await fetch(`${LOYVERSE_API_URL}/items`, {
    method: "POST",

    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },

    body: JSON.stringify(item),

    cache: "no-store",
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("Loyverse API Error:", data);

    throw new Error(
      data?.message || `Loyverse API request failed: ${response.status}`
    );
  }

  return data;
}