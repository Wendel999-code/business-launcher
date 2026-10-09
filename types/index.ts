export type Role = "admin" | "manager" | "staff";
export interface Profile {
  id: string;
  name: string;
  email: string;
  role: Role;
  branchId: string;
}
export interface Branch {
  id: string;
  name: string;
  code: string;
  address: string;
  manager: string;
  phone: string;
  color: string;
}
export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  unit: string;
  minimum: number;
  reorder: number;
  active: boolean;
  cost: number;
  inventoryTracked?: boolean;
}
export interface Inventory {
  productId: string;
  locationId: string;
  quantity: number;
  updatedAt: string;
}
export interface SaleItem {
  productId: string;
  quantity: number;
  kind: "Sold" | "Consumed";
}
export interface Sale {
  id: string;
  branchId: string;
  date: string;
  gross: number;
  discounts: number;
  transactions: number;
  cash: number;
  wallet: number;
  card: number;
  user: string;
  status: "Submitted" | "Draft";
  items?: SaleItem[];
}
export type TransferStatus =
  "Draft" | "Pending" | "Dispatched" | "In Transit" | "Received" | "Cancelled";
export interface TransferItem {
  productId: string;
  quantity: number;
  received?: number;
}
export interface Transfer {
  id: string;
  branchId: string;
  date: string;
  status: TransferStatus;
  items: TransferItem[];
  notes: string;
  user: string;
  receivedBy?: string;
  receivedAt?: string;
}
export interface Movement {
  id: string;
  productId: string;
  locationId: string;
  type: string;
  quantity: number;
  reference: string;
  date: string;
  user: string;
  remarks: string;
}
export interface Notice {
  id: string;
  branchId: string;
  title: string;
  category: string;
  time: string;
  read: boolean;
}
export interface Audit {
  id: string;
  branchId: string;
  date: string;
  user: string;
  role: Role;
  action: string;
  module: string;
  reference: string;
}
export interface PhysicalCount {
  id: string;
  productId: string;
  locationId: string;
  date: string;
  systemQuantity: number;
  physicalQuantity: number;
  variance: number;
  remarks: string;
  user: string;
}
export interface Store {
  products: Product[];
  inventory: Inventory[];
  sales: Sale[];
  transfers: Transfer[];
  movements: Movement[];
  notifications: Notice[];
  activity: Audit[];
  counts: PhysicalCount[];
}
