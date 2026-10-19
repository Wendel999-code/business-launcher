export type AppRole = "owner" | "admin" | "branch";

export function normalizeRole(value: string | null | undefined): AppRole {
  const role = String(value ?? "").trim().toLowerCase();

  if (role === "owner") return "owner";
  if (role === "admin") return "admin";
  if (role === "branch") return "branch";
  if (role === "manager" || role === "staff") return "branch";

  return "branch";
}

export function deriveRedirectPath(role: string | null | undefined): string {
  switch (normalizeRole(role)) {
    case "owner":
      return "/owner";
    case "admin":
      return "/admin";
    default:
      return "/branch";
  }
}

export function canAccessPage(
  role: string | null | undefined,
  page: string,
): boolean {
  const normalized = normalizeRole(role);

  if (normalized === "owner") return true;
  if (normalized === "admin") return true;

  const branchAccess = new Set([
    "dashboard",
    "sales",
    "inventory",
    "transfers",
    "adjustments",
    "wastage",
    "notifications",
    "activity",
    "movements",
    "branch",
  ]);

  return branchAccess.has(page);
}
