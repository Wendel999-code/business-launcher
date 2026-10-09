import { products, inventory } from "./products";
import { sales } from "./sales";
import { transfers, movements } from "./transfers";
import { activity, notifications } from "./activity";
import { Store } from "@/types";
export const initialStore: Store = {
  products,
  inventory,
  sales,
  transfers,
  movements,
  activity,
  notifications,
  counts: [
    {
      id: "CNT-0107",
      productId: "p1",
      locationId: "uptown",
      date: "2026-10-07",
      systemQuantity: 37,
      physicalQuantity: 36,
      variance: -1,
      remarks: "Physical count variance of 1 kg",
      user: "Sofia Garcia",
    },
  ],
};
