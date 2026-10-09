import { Profile } from "@/types";
export const adminPages = [
  "products",
  "branches",
  "users",
  "sales-reports",
  "inventory-reports",
  "branch-performance",
  "settings",
];
export const canAccess = (profile: Profile, page: string) =>
  profile.role === "admin" || !adminPages.includes(page);
export const canAccessLocation = (profile: Profile, locationId: string) =>
  profile.role === "admin" || profile.branchId === locationId;
