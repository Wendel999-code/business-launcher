import { Branch, Profile } from "@/types";
export const branches: Branch[] = [
  {
    id: "Amadeo",
    name: "Amadeo",
    code: "BR-001",
    address: "128  Avenue, Amadeo",
    manager: "Isabella Reyes",
    phone: "+63 917 821 4031",
    color: "#654332",
  },
  {
    id: "Gen Tri",
    name: "Gen Tri",
    code: "BR-002",
    address: "24 Riverbanks Avenue, Gen Tri",
    manager: "Miguel Santos",
    phone: "+63 917 821 4032",
    color: "#b68a60",
  },
  {
    id: "Tanza",
    name: "Tanza",
    code: "BR-003",
    address: "86 High Street, Tanza",
    manager: "Sofia Garcia",
    phone: "+63 917 821 4033",
    color: "#d6bea0",
  },
];
export const profiles: Profile[] = [
  {
    id: "admin",
    name: "Alex Morgan",
    email: "admin@brewcoffee.ph",
    role: "admin",
    branchId: "hq",
  },
  ...branches.map((b) => ({
    id: b.id,
    name: b.manager,
    email: `${b.id.toLowerCase().replace(/\s+/g, "-")}@brewcoffee.ph`,
    role: "manager" as const,
    branchId: b.id,
  })),

];
export const locationName = (id: string) =>
  id === "hq"
    ? "Head Office"
    : `${branches.find((b) => b.id === id)?.name ?? id} Branch`;
