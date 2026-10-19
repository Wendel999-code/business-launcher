import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type AppRole = "owner" | "admin" | "branch";
export type ApplicationProfile = {
  uuid: string;
  email: string;
  role: AppRole;
  branchId: string | null;
};

const fallbackRoleFromEmail = (email: string): AppRole => {
  const normalized = email.toLowerCase();

  if (normalized.includes("owner")) return "owner";
  if (normalized.includes("admin")) return "admin";

  return "branch";
};

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

export async function getCurrentProfile(): Promise<ApplicationProfile | null> {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return null;
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  let profile: {
    uuid?: string | null;
    email?: string | null;
    role?: string | null;
    branch_id?: string | null;
  } | null = null;

  try {
    const { data, error: profileError } = await supabase
      .from("app_users")
      .select("uuid, email, role, branch_id")
      .eq("uuid", user.id)
      .maybeSingle();

    if (!profileError) {
      profile = data;
    }
  } catch {
    profile = null;
  }

  if (profile) {
    return {
      uuid: String(profile.uuid ?? user.id),
      email: String(profile.email ?? user.email ?? ""),
      role: normalizeRole(profile.role),
      branchId: profile.branch_id ?? null,
    };
  }

  const fallbackRole = fallbackRoleFromEmail(user.email ?? "");

  return {
    uuid: user.id,
    email: user.email ?? "",
    role: fallbackRole,
    branchId: null,
  };
}

export async function requireAuth(): Promise<ApplicationProfile> {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  return profile;
}

export async function requireRole(required: AppRole): Promise<ApplicationProfile> {
  const current = await requireAuth();
  const currentRole = normalizeRole(current.role);

  if (required === "owner" && currentRole !== "owner") {
    redirect(deriveRedirectPath(currentRole));
  }

  if (required === "admin") {
    if (currentRole !== "admin" && currentRole !== "owner") {
      redirect(deriveRedirectPath(currentRole));
    }
  }

  if (required === "branch") {
    if (currentRole !== "branch") {
      redirect(deriveRedirectPath(currentRole));
    }
  }

  return current;
}
